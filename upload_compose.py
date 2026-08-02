#!/usr/bin/env python3
import paramiko
import os

def upload_and_deploy():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect("120.77.222.102", username="root", password="Wtd021219")
        sftp = ssh.open_sftp()

        # 上传docker-compose.yml
        print("上传docker-compose.yml...")
        sftp.put("docker-compose.yml", "/root/docker-compose.yml")
        print("上传完成！")

        # 上传.env
        print("\n上传.env...")
        sftp.put(".env", "/root/.env")
        print("上传完成！")

        # 停止所有服务
        print("\n停止现有服务...")
        stdin, stdout, stderr = ssh.exec_command("cd /root && docker compose down")
        print(stdout.read().decode('utf-8'))

        # 启动所有服务
        print("\n启动所有服务...")
        stdin, stdout, stderr = ssh.exec_command("cd /root && docker compose up -d --build")
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        print(output)
        if error:
            print("错误:", error)

        sftp.close()
        return True
    except Exception as e:
        print(f"部署失败: {str(e)}")
        return False
    finally:
        ssh.close()

if __name__ == "__main__":
    success = upload_and_deploy()
    print("\n部署完成！" if success else "\n部署失败！")