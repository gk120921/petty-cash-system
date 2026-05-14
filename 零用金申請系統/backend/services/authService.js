const bcrypt = require('bcryptjs');

/**
 * Service to handle authentication and password verification
 */
class AuthService {
  constructor(db) {
    this.db = db;
  }

  async login(employee_id, password) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT id, name, employee_id, role, status, password as hashedPassword FROM personnel WHERE employee_id = ?";
      this.db.get(sql, [employee_id], async (err, user) => {
        if (err) return reject(err);
        if (!user) return resolve({ success: false, error: "工號不存在 (Employee ID not found)" });
        if (user.status === 'INACTIVE') return resolve({ success: false, error: "此帳號已被停用 (Account Inactive)" });

        try {
          const isMatch = await bcrypt.compare(password, user.hashedPassword);
          if (!isMatch) {
            return resolve({ success: false, error: "密碼錯誤 (Invalid Password)" });
          }

          // Success: Remove sensitive data
          const userData = { ...user };
          delete userData.hashedPassword;
          resolve({ success: true, user: userData });
        } catch (bcryptErr) {
          reject(new Error("伺服器驗證出錯 (Server Authentication Error)"));
        }
      });
    });
  }
}

module.exports = AuthService;
