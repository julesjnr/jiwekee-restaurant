import { useState, useEffect, useRef } from "react";
import { api } from "../../api/client";

async function processImageFile(file) {
  // If file is smaller than 1.2MB, upload directly
  if (file.size <= 1.2 * 1024 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const safeName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const newFile = new File([blob], safeName, {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file);
            }
          },
          "image/webp",
          0.88
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Grills",
    image_url: "/images/choma.jpg",
    prep_time_minutes: 15,
    is_featured: false,
  });

  const fetchMenu = () => {
    setLoading(true);
    api
      .getMenu({ all: "true" })
      .then((data) => {
        setItems(data.items || []);
        const cats = (data.categories || []).filter((c) => c !== "All");
        setCategories(cats.length > 0 ? cats : ["Grills", "Swahili Classics", "Pizza", "Seafood", "Desserts", "Beverages"]);
      })
      .catch((err) => console.error("Menu fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: categories[0] || "Grills",
      image_url: "/images/choma.jpg",
      prep_time_minutes: 15,
      is_featured: false,
    });
    setEditingItem(null);
    setUploadError(null);
    setUploadingImage(false);
    setShowUrlFallback(false);
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category || "Grills",
      image_url: item.image_url || "/images/choma.jpg",
      prep_time_minutes: item.prep_time_minutes || 15,
      is_featured: Boolean(item.is_featured),
    });
    setEditingItem(item);
    setUploadError(null);
    setUploadingImage(false);
    setShowUrlFallback(false);
    setIsNewModalOpen(true);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid file type. Supported formats: JPEG, PNG, WebP, GIF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    setUploadError(null);
    setUploadingImage(true);

    try {
      const processed = await processImageFile(file);
      const res = await api.uploadDishImage(processed);
      if (res.imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: res.imageUrl }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.id, formData);
      } else {
        await api.createMenuItem(formData);
      }
      setIsNewModalOpen(false);
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to save menu item.");
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await api.toggleMenuAvailability(id);
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to toggle availability.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) {
      return;
    }
    try {
      await api.deleteMenuItem(id);
      fetchMenu();
    } catch (err) {
      alert(err.message || "Failed to delete item.");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>Restaurant Menu Management</h2>
          <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
            Add, update pricing, categories, prep times, and toggle dish availability.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-action-sm btn-action-primary">
          + Add New Dish
        </button>
      </div>

      {loading ? (
        <div className="loading-notice">Loading menu items from database...</div>
      ) : (
        <div className="data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Price</th>
                <th>Prep Time</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover" }}
                        onError={(e) => { e.target.src = "/images/choma.jpg"; }}
                      />
                      <div>
                        <div style={{ fontWeight: "700", color: "#fff" }}>{item.name}</div>
                        <div style={{ fontSize: "11px", color: "#888", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: "#222", padding: "3px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: "800", color: "#ffcc00" }}>
                    KES {Number(item.price).toFixed(2)}
                  </td>
                  <td style={{ color: "#aaa" }}>{item.prep_time_minutes || 15} mins</td>
                  <td>
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`btn-action-sm ${item.is_available !== false ? "btn-action-green" : "btn-action-red"}`}
                      style={{ fontSize: "11px" }}
                    >
                      {item.is_available !== false ? "Available" : "Sold Out"}
                    </button>
                  </td>
                  <td>
                    {item.is_featured ? (
                      <span style={{ color: "#ffcc00", fontWeight: "700", fontSize: "12px" }}>Yes</span>
                    ) : (
                      <span style={{ color: "#666", fontSize: "12px" }}>No</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn-action-sm btn-action-dark"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="btn-action-sm btn-action-red"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      {isNewModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? "Edit Menu Dish" : "Add New Dish"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-input-group">
                <label>Dish Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nyama Choma Platter"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-input-group">
                  <label>Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="850"
                  />
                </div>
                <div className="form-input-group">
                  <label>Category (from Database)</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "#1a1a1a",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-input-group">
                <label>Preparation Time (Minutes)</label>
                <input
                  type="number"
                  value={formData.prep_time_minutes}
                  onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                  placeholder="15"
                />
              </div>

              {/* Image Upload Component */}
              <div className="form-input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ margin: 0, fontWeight: "700" }}>Dish Photo / Image</label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-accent, #c96b32)",
                      fontSize: "12px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {showUrlFallback ? "Switch to Local Upload" : "Or enter Image URL"}
                  </button>
                </div>

                {showUrlFallback ? (
                  <div>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/images/choma.jpg or https://..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1.5px solid var(--color-border)",
                        background: "#fff",
                        color: "#1d1916",
                        fontSize: "14px",
                      }}
                    />
                    <p style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                      Tip: You can use relative paths like <code>/images/choma.jpg</code> or uploaded URLs.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />

                    {/* Drag and Drop & Preview Area */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: dragActive
                          ? "2px dashed var(--color-accent, #c96b32)"
                          : "2px dashed rgba(201, 107, 50, 0.4)",
                        backgroundColor: dragActive
                          ? "rgba(201, 107, 50, 0.1)"
                          : "var(--color-surface-soft, #f8f4ee)",
                        borderRadius: "12px",
                        padding: "14px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Image Preview Thumbnail */}
                        <div
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1.5px solid var(--color-border-strong, #d6cbc0)",
                            flexShrink: 0,
                            backgroundColor: "#171412",
                            position: "relative",
                          }}
                        >
                          <img
                            src={formData.image_url || "/images/choma.jpg"}
                            alt="Dish preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.src = "/images/choma.jpg";
                            }}
                          />
                          {uploadingImage && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.65)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: "700",
                                textAlign: "center",
                                padding: "2px",
                              }}
                            >
                              Uploading...
                            </div>
                          )}
                        </div>

                        {/* Actions & Notes */}
                        <div style={{ flex: "1 1 200px" }}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                            <button
                              type="button"
                              disabled={uploadingImage}
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-action-sm btn-action-primary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: uploadingImage ? "not-allowed" : "pointer",
                                opacity: uploadingImage ? 0.7 : 1,
                              }}
                            >
                              📁 {uploadingImage ? "Uploading..." : "Upload from Computer"}
                            </button>

                            {formData.image_url && formData.image_url !== "/images/choma.jpg" && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, image_url: "/images/choma.jpg" })}
                                className="btn-action-sm btn-action-dark"
                                style={{ fontSize: "11px" }}
                              >
                                Reset Default
                              </button>
                            )}
                          </div>

                          <div style={{ fontSize: "12px", color: "var(--color-text-muted, #756d66)" }}>
                            Drag and drop an image file here, or click to browse.
                          </div>
                          <div style={{ fontSize: "11px", color: "#9e958d", marginTop: "2px" }}>
                            Formats: <strong>JPEG, PNG, WebP</strong> (Max 5MB)
                          </div>
                        </div>
                      </div>

                      {/* Error Message */}
                      {uploadError && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            background: "rgba(184, 76, 67, 0.12)",
                            color: "#b84c43",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          ⚠️ {uploadError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-input-group">
                <label>Description & Ingredients</label>
                <textarea
                  rows="3"
                  className="custom-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the dish flavors and sides..."
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <label htmlFor="is_featured" style={{ fontSize: "14px", color: "#ffcc00", cursor: "pointer" }}>
                  Mark as Chef's Featured Specialty
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="btn-action-sm btn-action-dark"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-action-sm btn-action-primary">
                  {editingItem ? "Save Changes" : "Create Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
