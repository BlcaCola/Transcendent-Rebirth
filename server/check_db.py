import sqlite3

conn = sqlite3.connect('TranscendentRebirth.db')
cursor = conn.cursor()

print("=== 所有表 ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print([t[0] for t in tables])

if tables:
    print("\n=== users表结构 ===")
    cursor.execute('PRAGMA table_info(users)')
    for row in cursor.fetchall():
        print(f"{row[1]}: {row[2]}")

    print("\n=== 查询管理员用户 ===")
    cursor.execute('SELECT id, account_id, user_name, email, is_admin, last_login FROM users WHERE is_admin=1')
    result = cursor.fetchone()
    if result:
        print(f"ID: {result[0]}")
        print(f"账号ID: {result[1]}")
        print(f"用户名: {result[2]}")
        print(f"邮箱: {result[3]}")
        print(f"是否管理员: {result[4]}")
        print(f"最后登录-北京时间: {result[5]}")
    else:
        print("没有管理员用户")

conn.close()
