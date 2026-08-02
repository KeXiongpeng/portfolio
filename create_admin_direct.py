#!/usr/bin/env python3
"""
直接在数据库中创建管理员账号
"""
import paramiko
import subprocess
import json

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
    """使用 Python bcrypt 生成密码哈希"""
    try:
        import bcrypt
        # 生成盐并哈希密码
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except ImportError:
        print("错误: 需要安装 bcrypt 库")
        print("请运行: pip install bcrypt")
        exit(1)

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
    print("创建超级管理员账号")
    print("=" * 60)

    # 1. 生成密码哈希
    print("\n【步骤1: 生成密码哈希】")
    password_hash = generate_bcrypt_hash(ADMIN_PASSWORD)
    print(f"✓ 密码哈希已生成: {password_hash[:20]}...")

    # 2. 插入用户数据
    print("\n【步骤2: 创建用户】")
    sql_insert_user = f"""docker exec root-postgres-1 psql -U postgres -d portfolio -c "INSERT INTO users (username, email, role_id, created_at) VALUES ('{ADMIN_USERNAME}', '{ADMIN_EMAIL}', {ADMIN_ROLE_ID}, NOW()) RETURNING id, username, email, role_id;" """

    output, error = run_ssh_command(HOST, USER, PASS, sql_insert_user)
    if output and 'INSERT' in output:
        print("✓ 用户创建成功")
        print(output)

        # 提取用户ID
        lines = output.strip().split('\n')
        if len(lines) >= 3:
            # 解析返回的用户ID
            data_line = lines[2].strip()
            user_id = data_line.split()[0]
            print(f"  用户ID: {user_id}")

            # 3. 插入账户数据
            print("\n【步骤3: 创建账户】")
            sql_insert_account = f"""docker exec root-postgres-1 psql -U postgres -d portfolio -c "INSERT INTO accounts (user_id, provider, provider_user_id, password_hash) VALUES ({user_id}, 'local', '{ADMIN_USERNAME}', '{password_hash}');" """

            output2, error2 = run_ssh_command(HOST, USER, PASS, sql_insert_account)
            if output2 and 'INSERT' in output2:
                print("✓ 账户创建成功")
                print(output2)
            else:
                print("✗ 账户创建失败")
                if error2:
                    print("错误:", error2)
    else:
        print("✗ 用户创建失败")
        if error:
            print("错误:", error)

    # 4. 验证创建结果
    print("\n【验证创建结果】")
    sql_verify = "docker exec root-postgres-1 psql -U postgres -d portfolio -c \"SELECT u.id, u.username, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = 'kexiongpeng';\""
    output, error = run_ssh_command(HOST, USER, PASS, sql_verify)
    if output:
        print(output)

    print("\n" + "=" * 60)
    print("创建完成！")
    print(f"请访问 http://120.77.222.102:3000/admin/login 登录")
    print(f"用户名: {ADMIN_USERNAME}")
    print(f"密码: {ADMIN_PASSWORD}")
    print("=" * 60)