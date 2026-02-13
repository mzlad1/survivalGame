import React, { useState } from "react";

function ProfileSetup({ onProfileCreated }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && age) {
      onProfileCreated({ name: name.trim(), age: parseInt(age) });
    }
  };

  return (
    <div className="profile-setup">
      <h2>إنشاء ملف شخصي</h2>
      <p className="subtitle">أدخل اسمك وعمرك لبدء رحلة التعلم</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>الاسم - Name</label>
          <input
            type="text"
            placeholder="أدخل اسمك هنا..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="input-group">
          <label>العمر - Age</label>
          <input
            type="number"
            placeholder="العمر (5-15)"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="5"
            max="15"
            required
          />
        </div>
        <button type="submit">🚀 ابدأ المغامرة - Start Adventure</button>
      </form>
    </div>
  );
}

export default ProfileSetup;
