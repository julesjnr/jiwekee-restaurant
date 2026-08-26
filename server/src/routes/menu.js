import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { pool } from "../db/pool.js";
import { requireStaff } from "../middleware/auth.js";
import { logAudit } from "./auth.js";

const router = Router();

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `dish-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed."));
  },
});

// POST /api/menu/upload — staff uploads a dish image file
router.post("/upload", requireStaff, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Image file size exceeds the 5MB limit." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || "Failed to upload image." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ ok: true, imageUrl, filename: req.file.filename });
  });
});

// GET /api/menu/categories — retrieve categories directly from database
router.get("/categories", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, created_at FROM categories ORDER BY id ASC"
    );
    res.json({ categories: result.rows });
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to load menu categories." });
  }
});

// GET /api/menu — retrieve items and categories from PostgreSQL
router.get("/", async (req, res) => {
  try {
    const { category, search, all } = req.query;

    const conditions = [];
    const params = [];

    // Filter available items for customers unless staff requests `all=true`
    if (!all || all === "false") {
      conditions.push("m.is_available = TRUE");
    }

    if (category && category !== "All") {
      params.push(category.trim().toLowerCase());
      conditions.push("(LOWER(m.category) = $" + params.length + " OR LOWER(c.name) = $" + params.length + ")");
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push("(LOWER(m.name) LIKE $" + params.length + " OR LOWER(COALESCE(m.description, '')) LIKE $" + params.length + ")");
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const itemsQuery = `
      SELECT
        m.id,
        m.category_id,
        m.name,
        m.description,
        m.price::float as price,
        COALESCE(c.name, m.category, 'Main Course') AS category,
        m.image_url,
        m.is_available,
        m.is_featured,
        m.prep_time_minutes,
        m.created_at,
        m.updated_at
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      ${whereClause}
      ORDER BY m.is_featured DESC, m.id ASC
    `;

    const itemsResult = await pool.query(itemsQuery, params);

    // Retrieve categories from categories table
    const categoriesResult = await pool.query(
      "SELECT name FROM categories ORDER BY id ASC"
    );
    const categoryNames = categoriesResult.rows.map((r) => r.name);

    res.json({
      items: itemsResult.rows,
      categories: categoryNames,
    });
  } catch (err) {
    console.error("Fetch menu error:", err);
    res.status(500).json({ error: "Could not load the menu from database." });
  }
});

// POST /api/menu — staff adds new menu item to PostgreSQL
router.post("/", requireStaff, async (req, res) => {
  try {
    const { name, description, price, category, category_id, image_url, prep_time_minutes, is_featured } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: "Item name and price are required." });
    }

    let catId = category_id ? Number(category_id) : null;
    let catName = category ? category.trim() : "Main Course";

    if (!catId && catName) {
      const catCheck = await pool.query(
        "SELECT id, name FROM categories WHERE LOWER(name) = LOWER($1)",
        [catName]
      );
      if (catCheck.rows.length > 0) {
        catId = catCheck.rows[0].id;
        catName = catCheck.rows[0].name;
      } else {
        const catInsert = await pool.query(
          "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name",
          [catName]
        );
        catId = catInsert.rows[0].id;
      }
    }

    const insertResult = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, category, image_url, is_available, is_featured, prep_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, category_id, name, description, price::float as price, category, image_url, is_available, is_featured, prep_time_minutes, created_at, updated_at`,
      [
        catId,
        name.trim(),
        description ? description.trim() : "",
        Number(price),
        catName,
        image_url || "/images/choma.jpg",
        true,
        Boolean(is_featured),
        Number(prep_time_minutes) || 15,
      ]
    );

    const newItem = insertResult.rows[0];

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: "MENU_CREATE",
      entity: "menu_items",
      entityId: newItem.id,
      details: `Added new dish: ${newItem.name} (KES ${newItem.price}) under ${newItem.category}`,
    });

    res.status(201).json({ item: newItem });
  } catch (err) {
    console.error("Add menu item error:", err);
    res.status(500).json({ error: "Failed to add menu item." });
  }
});

// PUT /api/menu/:id — staff edits menu item in PostgreSQL
router.put("/:id", requireStaff, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, category, category_id, image_url, prep_time_minutes, is_available, is_featured } = req.body;

    const existingResult = await pool.query("SELECT * FROM menu_items WHERE id = $1", [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    const oldItem = existingResult.rows[0];

    let catId = category_id !== undefined ? Number(category_id) : oldItem.category_id;
    let catName = category !== undefined ? category.trim() : oldItem.category;

    if (category && !category_id) {
      const catCheck = await pool.query(
        "SELECT id, name FROM categories WHERE LOWER(name) = LOWER($1)",
        [catName]
      );
      if (catCheck.rows.length > 0) {
        catId = catCheck.rows[0].id;
        catName = catCheck.rows[0].name;
      }
    }

    const updateResult = await pool.query(
      `UPDATE menu_items
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price),
         category = COALESCE($4, category),
         category_id = COALESCE($5, category_id),
         image_url = COALESCE($6, image_url),
         prep_time_minutes = COALESCE($7, prep_time_minutes),
         is_available = COALESCE($8, is_available),
         is_featured = COALESCE($9, is_featured),
         updated_at = now()
       WHERE id = $10
       RETURNING id, category_id, name, description, price::float as price, category, image_url, is_available, is_featured, prep_time_minutes, created_at, updated_at`,
      [
        name !== undefined ? name.trim() : null,
        description !== undefined ? description.trim() : null,
        price !== undefined ? Number(price) : null,
        catName,
        catId,
        image_url !== undefined ? image_url : null,
        prep_time_minutes !== undefined ? Number(prep_time_minutes) : null,
        is_available !== undefined ? Boolean(is_available) : null,
        is_featured !== undefined ? Boolean(is_featured) : null,
        id,
      ]
    );

    const updatedItem = updateResult.rows[0];

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: "MENU_UPDATE",
      entity: "menu_items",
      entityId: updatedItem.id,
      details: `Updated dish: ${updatedItem.name}. Price change: KES ${oldItem.price} -> KES ${updatedItem.price}`,
    });

    res.json({ item: updatedItem });
  } catch (err) {
    console.error("Edit menu item error:", err);
    res.status(500).json({ error: "Failed to update menu item." });
  }
});

// PATCH /api/menu/:id/toggle-availability
router.patch("/:id/toggle-availability", requireStaff, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updateResult = await pool.query(
      `UPDATE menu_items
       SET is_available = NOT is_available, updated_at = now()
       WHERE id = $1
       RETURNING id, name, is_available, price::float as price, category`,
      [id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    const item = updateResult.rows[0];

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: item.is_available ? "MENU_ENABLE" : "MENU_DISABLE",
      entity: "menu_items",
      entityId: item.id,
      details: `${item.name} marked as ${item.is_available ? "Available" : "Unavailable"}`,
    });

    res.json({ item });
  } catch (err) {
    console.error("Toggle availability error:", err);
    res.status(500).json({ error: "Failed to toggle menu availability." });
  }
});

// DELETE /api/menu/:id
router.delete("/:id", requireStaff, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleteResult = await pool.query(
      "DELETE FROM menu_items WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    const deleted = deleteResult.rows[0];

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: "MENU_DELETE",
      entity: "menu_items",
      entityId: deleted.id,
      details: `Deleted menu dish: ${deleted.name}`,
    });

    res.json({ ok: true, item: deleted });
  } catch (err) {
    console.error("Delete menu item error:", err);
    res.status(500).json({ error: "Failed to delete menu item." });
  }
});

export default router;
