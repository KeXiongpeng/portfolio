#!/usr/bin/env python3
"""
查看 server/package.json 的完整内容
"""
import paramiko
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

if __name__ == "__main__":
    HOST = "120.77.222.102"
    USER = "root"
    PASS = "Wtd021219"

    # 读取 package.json
    cmd = "cat /root/server/package.json"
    output, error = run_ssh_command(HOST, USER, PASS, cmd)

    if output:
        try:
            # 解析 JSON
            package_json = json.loads(output)

            print("=" * 60)
            print("package.json 内容")
            print("=" * 60)

            print("\n【名称】:", package_json.get('name', 'N/A'))
            print("\n【版本】:", package_json.get('version', 'N/A'))

            print("\n【Scripts】:")
            scripts = package_json.get('scripts', {})
            for key, value in scripts.items():
                print(f"  {key}: {value}")

            # 检查是否有 create-admin
            if 'create-admin' in scripts:
                print("\n✓ 找到 create-admin 脚本")
                print(f"  命令: npm run create-admin")
            else:
                print("\n✗ package.json 中没有 create-admin 脚本")
                print("  但可以直接运行: node dist/src/scripts/create-admin.js")

        except json.JSONDecodeError as e:
            print("JSON 解析失败:", e)
            print("\n原始内容:")
            print(output)