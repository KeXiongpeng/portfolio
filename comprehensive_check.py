#!/usr/bin/env python3
import paramiko
import sys

def run_ssh_command(host, username, password, command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command(command)
        return stdout.read().decode('utf-8'), stderr.read().decode('utf-8')
    finally:
        ssh.close()

if __name__ == "__main__":
    HOST = "120.77.222.102"
    USER = "root"
    PASS = "Wtd021219"
    cmd = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "docker ps"
    out, err = run_ssh_command(HOST, USER, PASS, cmd)
    print(out if out else err)