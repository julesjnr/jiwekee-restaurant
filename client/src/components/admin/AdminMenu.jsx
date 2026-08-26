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
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">
            <i className="fa fa-utensils" style={{ color: "var(--primary)" }}></i>
            Restaurant Menu Catalog Management
          </h2>
          <p className="admin-card-desc">
            Add new signature dishes, adjust pricing, categories, prep estimates, and toggle live item availability for guests.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-restoran-primary">
          <i className="fa fa-plus"></i> Add New Dish
        </button>
      </div>

      {loading ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)", marginBottom: "12px", display: "block" }}></i>
          <h4 style={{ color: "var(--secondary)", margin: 0 }}>Loading Menu Items from PostgreSQL Database...</h4>
        </div>
      ) : (
        <div className="admin-data-table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Dish Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Prep Time</th>
                <th>Availability</th>
                <th>Specialty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid var(--primary)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                        onError={(e) => { e.target.src = "/images/choma.jpg"; }}
                      />
                      <div>
                        <div style={{ fontWeight: "800", color: "var(--secondary)", fontFamily: "Nunito, sans-serif", fontSize: "14.5px" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--gray)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: "var(--light-bg)", border: "1px solid var(--light-gray)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", color: "var(--secondary)" }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: "900", color: "var(--primary-dark)", fontFamily: "Nunito, sans-serif", fontSize: "15px" }}>
                    KES {Number(item.price).toFixed(2)}
                  </td>
                  <td style={{ color: "var(--gray)", fontSize: "13px" }}>
                    <i className="fa fa-clock" style={{ color: "var(--primary)", marginRight: "4px" }}></i>
                    {item.prep_time_minutes || 15} mins
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`status-badge ${item.is_available !== false ? "status-completed" : "status-cancelled"}`}
                      style={{ cursor: "pointer", border: "none" }}
                      title="Click to toggle availability"
                    >
                      <i className={`fa ${item.is_available !== false ? "fa-check" : "fa-ban"}`}></i>
                      {item.is_available !== false ? "Available" : "Sold Out"}
                    </button>
                  </td>
                  <td>
                    {item.is_featured ? (
                      <span className="status-badge status-pending" style={{ fontWeight: "800" }}>
                        <i className="fa fa-star" style={{ color: "var(--primary-dark)" }}></i> Featured
                      </span>
                    ) : (
                      <span style={{ color: "var(--gray)", fontSize: "12px" }}>Standard</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn-restoran-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        <i className="fa fa-edit"></i> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="btn-restoran-danger"
                      >
                        <i className="fa fa-trash"></i> Delete
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
        <div className="admin-modal-overlay" onClick={() => setIsNewModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa fa-utensils" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
                <h3 className="admin-modal-title">
                  {editingItem ? "Edit Menu Dish" : "Create New Menu Dish"}
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="admin-modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Dish Name *</label>
                <input
                  type="text"
                  required
                  className="restoran-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Swahili Biryani Special"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="restoran-label">Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="restoran-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="850"
                  />
                </div>
                <div>
                  <label className="restoran-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="restoran-select"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="restoran-label">Estimated Preparation Time (Minutes)</label>
                <input
                  type="number"
                  className="restoran-input"
                  value={formData.prep_time_minutes}
                  onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                  placeholder="15"
                />
              </div>

              {/* Image Upload Component */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="restoran-label" style={{ margin: 0 }}>Dish Photo / Image</label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontSize: "12px",
                      fontWeight: "700",
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
                      className="restoran-input"
                    />
                    <p style={{ fontSize: "11.5px", color: "var(--gray)", marginTop: "4px" }}>
                      Tip: You can use local paths like <code>/images/choma.jpg</code> or external image URLs.
                    </p>
                  </div>
                ) : (
                  <div>
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

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      style={{
                        border: dragActive
                          ? "2px dashed var(--primary)"
                          : "2px dashed rgba(212, 167, 74, 0.4)",
                        backgroundColor: dragActive
                          ? "rgba(212, 167, 74, 0.1)"
                          : "var(--light-bg)",
                        borderRadius: "12px",
                        padding: "16px",
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
                        <div
                          style={{
                            width: "74px",
                            height: "74px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "2px solid var(--primary)",
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

                        <div style={{ flex: "1 1 200px" }}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                            <button
                              type="button"
                              disabled={uploadingImage}
                              onClick={() => fileInputRef.current?.click()}
                              className="btn-restoran-primary"
                              style={{
                                padding: "6px 14px",
                                fontSize: "12px",
                                cursor: uploadingImage ? "not-allowed" : "pointer",
                                opacity: uploadingImage ? 0.7 : 1,
                              }}
                            >
                              <i className="fa fa-folder-open"></i> {uploadingImage ? "Uploading..." : "Upload Photo"}
                            </button>

                            {formData.image_url && formData.image_url !== "/images/choma.jpg" && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, image_url: "/images/choma.jpg" })}
                                className="btn-restoran-secondary"
                                style={{ padding: "6px 10px", fontSize: "11.5px" }}
                              >
                                Reset Default
                              </button>
                            )}
                          </div>

                          <div style={{ fontSize: "12px", color: "var(--gray)" }}>
                            Drag and drop an image file here, or click to browse.
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--gray)", marginTop: "2px" }}>
                            Formats: <strong>JPEG, PNG, WebP</strong> (Max 5MB)
                          </div>
                        </div>
                      </div>

                      {uploadError && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            background: "#FEE2E2",
                            color: "#B91C1C",
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

              <div style={{ marginBottom: "18px" }}>
                <label className="restoran-label">Description & Ingredients</label>
                <textarea
                  rows="3"
                  className="restoran-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the dish flavours, marination, and sides..."
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "var(--primary)", cursor: "pointer" }}
                />
                <label htmlFor="is_featured" style={{ fontSize: "14px", fontWeight: "700", color: "var(--secondary)", cursor: "pointer" }}>
                  <i className="fa fa-crown" style={{ color: "var(--primary)", marginRight: "6px" }}></i>
                  Highlight as Chef's Featured Specialty
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="btn-restoran-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-restoran-primary">
                  <i className="fa fa-save"></i> {editingItem ? "Save Changes" : "Create Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
