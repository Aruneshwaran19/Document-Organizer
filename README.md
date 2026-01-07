# 📁 Smart Document Organizer (DocVault)

A modern, secure, front-end document management web app that allows users to create, organize, and protect documents using an optional encrypted vault — all handled locally in the browser.

---

## 🚀 Features

### 📄 Normal Documents
- Create, edit, and delete documents
- Live search by document title
- Persistent storage using `localStorage`

### 🔒 Protected Vault
- Optional password-protected encrypted vault
- Client-side encryption using **AES-GCM**
- Secure add, edit, and delete operations
- Lock and unlock vault at any time
- Export and import encrypted vault backups

### 📊 Dashboard
- Total normal and protected document count
- Vault status (Locked / Unlocked)
- Recent documents panel (shows last 5 entries)
- Visual badges for document source (Normal / Vault)

### 👤 Profile
- Display name
- Auto-generated serial ID
- Vault enabled status

---

## 🛠️ Tech Stack

- **HTML5**
- **CSS3** (CSS Grid, Flexbox, custom theme variables)
- **JavaScript (Vanilla)**
- **Web Crypto API** (AES-GCM + PBKDF2)
- **LocalStorage**

---

## 🔐 Security Notes

- All vault data is encrypted on the client side
- Passwords are never stored
- Vault data cannot be recovered without the correct password
- Losing the password permanently locks the vault

---

## 📂 Project Structure

```text
.
├── index.html
├── styles.css
├── script.js
└── README.md
```


## 💡 Use Cases

- Personal document and notes organizer  
- Secure local storage for sensitive text  
- Front-end portfolio project  
- Web Crypto API demonstration  

---

## 📸 Preview

![Screenshot (473)](https://github.com/Aruneshwaran19/Document-Organizer/blob/fd2bcf5c25434753648f4e753fdecaf49de33129/Screenshot%20(98).png)


---

## 📜 License

This project is licensed under the [MIT License](LICENSE)
