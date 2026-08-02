#!/usr/bin/env python3
"""
彻底清理用户和账户表，重新创建管理员账号
"""
import paramiko
import bcrypt

def run_ssh_command(host, username, password, command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        return output, error
    finally:
        ssh.close()

def generate_bcrypt_hash(password):
    """使用 bcrypt 生成密码哈希"""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

if __name__ == "__main__":
    HOST = "120.77.222.102"
    USER = "root"
    PASS = "Wtd021219"

    # 管理员账号信息
    ADMIN_USERNAME = "kexiongpeng"
    ADMIN_EMAIL = "1443546343@qq.com"
    ADMIN_PASSWORD = "Wtd021219"
    ADMIN_ROLE_ID = 3  # super_admin

    print("=" * 60)
    print("彻底清理并重新创建管理员账号")
    print("=" * 60)

    # 1. 查看当前数据
    print("\n【当前数据统计】")
    sql_count_users = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) FROM users;\""
    output, _ = run_ssh_command(HOST, USER, PASS, sql_count_users)
    print("users 表:", output.strip())

    sql_count_accounts = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT COUNT(*) FROM accounts;\""
    output, _ = run_ssh_command(HOST, USER, PASS, sql_count_accounts)
    print("accounts 表:", output.strip())

    # 2. 删除所有账户数据
    print("\n【步骤1: 删除所有账户数据】")
    sql_delete_accounts = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"DELETE FROM accounts;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_delete_accounts)
    if output and 'DELETE' in output:
        print("✓ accounts 表已清空")
    elif error:
        print("✗ 删除失败:", error)

    # 3. 删除所有用户数据
    print("\n【步骤2: 删除所有用户数据】")
    sql_delete_users = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"DELETE FROM users;\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_delete_users)
    if output and 'DELETE' in output:
        print("✓ users 表已清空")
    elif error:
        print("✗ 删除失败:", error)

    # 4. 重置序列（确保 ID 从 1 开始）
    print("\n【步骤3: 重置序列】")
    sql_reset_seq1 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"ALTER SEQUENCE users_id_seq RESTART WITH 1;\""
    output, _ = run_ssh_command(HOST, USER, PASS, sql_reset_seq1)
    print("✓ users_id_seq 已重置")

    sql_reset_seq2 = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"ALTER SEQUENCE accounts_id_seq RESTART WITH 1;\""
    output, _ = run_ssh_command(HOST, USER, PASS, sql_reset_seq2)
    print("✓ accounts_id_seq 已重置")

    # 5. 生成密码哈希
    print("\n【步骤4: 生成密码哈希】")
    password_hash = generate_bcrypt_hash(ADMIN_PASSWORD)
    print(f"✓ 密码哈希已生成: {password_hash[:30]}...")

    # 6. 插入用户数据
    print("\n【步骤5: 创建管理员用户】")
    sql_insert_user = f"""docker exec root-postgres-1 psql -U postgres -d portfolio -c "INSERT INTO users (username, email, role_id, created_at) VALUES ('{ADMIN_USERNAME}', '{ADMIN_EMAIL}', {ADMIN_ROLE_ID}, NOW()) RETURNING id, username, email, role_id;" """

    output, error = run_ssh_command(HOST, USER, PASS, sql_insert_user)
    if output and 'INSERT' in output:
        print("✓ 用户创建成功")
        print(output)

        # 提取用户ID
        lines = output.strip().split('\n')
        if len(lines) >= 3:
            data_line = lines[2].strip()
            user_id = data_line.split()[0]

            # 7. 插入账户数据
            print("\n【步骤6: 创建账户】")
            sql_insert_account = f"""docker exec root-postgres-1 psql -U postgres -d portfolio -c "INSERT INTO accounts (user_id, provider, provider_user_id, password_hash) VALUES ({user_id}, 'local', '{ADMIN_USERNAME}', '{password_hash}');" """

            output2, error2 = run_ssh_command(HOST, USER, PASS, sql_insert_account)
            if output2 and 'INSERT' in output2:
                print("✓ 账户创建成功")
            else:
                print("✗ 账户创建失败")
                if error2:
                    print("错误:", error2)
    else:
        print("✗ 用户创建失败")
        if error:
            print("错误:", error)

    # 8. 验证创建结果
    print("\n【验证创建结果】")
    sql_verify_users = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT u.id, u.username, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id;\""
    output, _ = run_ssh_command(HOST, USER, PASS, sql_verify_users)
    print(output)

    sql_verify_accounts = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT user_id, provider, provider_user_id FROM accounts;\""
    output, _ = run_ssh_command(HOST, USER, PASS, sql_verify_accounts)
    print(output)

    print("\n" + "=" * 60)
    print("✓ 创建完成！")
    print(f"访问: http://120.77.222.102:3000/admin/login")
    print(f"用户名: {ADMIN_USERNAME}")
    print(f"密码: {ADMIN_PASSWORD}")
    print("=" * 60)