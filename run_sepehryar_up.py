# run_sepehryar_up.py
"""
راه‌انداز خودکار، دائمی و بی‌صدای مرکز آپدیت و دانلود سپهریار
- راه‌اندازی سرور محلی روی پورت ۳۰۰۰
- اتصال تونل اختصاصی اینترنتی Cloudflare جهت دسترسی آنلاین از سراسر وب
- ثبت در استارتاپ ویندوز برای فعال بودن همیشگی پس از روشن شدن سیستم
- ایجاد شورت‌کات مستقیم و فایل لینک روی دسکتاپ
"""

import os
import sys
import time
import socket
import glob
import subprocess
import webbrowser
from pathlib import Path

UP_DIR = Path(r"D:\up")
CLOUDFLARED_EXE = Path(r"D:\ai app\cloudflared.exe")
DESKTOP_DIR = Path(os.environ.get("USERPROFILE", "")) / "Desktop"
STARTUP_DIR = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
PYTHONW_EXE = Path(r"D:\Projects\ai app\.venv\Scripts\pythonw.exe")
if not PYTHONW_EXE.exists():
    PYTHONW_EXE = Path(sys.executable).parent / "pythonw.exe"
if not PYTHONW_EXE.exists():
    PYTHONW_EXE = Path(sys.executable)


def find_node_exe() -> Path:
    pattern = os.path.expandvars(r"%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*\bin\node.exe")
    matches = glob.glob(pattern)
    if matches:
        return Path(matches[0])
    return Path("node")


def is_port_listening(port: int = 3000, host: str = "127.0.0.1") -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.6)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def start_server_background():
    if is_port_listening(3000):
        return

    node_exe = find_node_exe()
    creation_flags = 0x08000000  # CREATE_NO_WINDOW
    log_file = UP_DIR / "server_output.log"
    with open(log_file, "a", encoding="utf-8") as out:
        subprocess.Popen(
            [str(node_exe), "scripts/run-framework.mjs", "dev", "-H", "0.0.0.0", "--port", "3000"],
            cwd=str(UP_DIR),
            stdout=out,
            stderr=out,
            creationflags=creation_flags,
        )

    # صبر جهت لیسن شدن پورت
    for _ in range(15):
        if is_port_listening(3000):
            break
        time.sleep(0.5)


def start_cloudflared_tunnel():
    if not CLOUDFLARED_EXE.exists():
        return

    # بررسی اگر cloudflared در حال حاضر فعال است
    # خواندن لاگ برای دریافت آخرین لینک
    tunnel_log = UP_DIR / "tunnel.log"
    creation_flags = 0x08000000  # CREATE_NO_WINDOW

    # بررسی اینکه آیا پروسه cloudflared از قبل در حال اجراست
    running = False
    try:
        output = subprocess.check_output('tasklist /FI "IMAGENAME eq cloudflared.exe"', shell=True, text=True)
        if "cloudflared.exe" in output:
            running = True
    except Exception:
        pass

    if not running:
        # استارت مجدد تونل
        with open(tunnel_log, "w", encoding="utf-8") as t_log:
            subprocess.Popen(
                [str(CLOUDFLARED_EXE), "tunnel", "--url", "http://127.0.0.1:3000"],
                cwd=str(UP_DIR),
                stdout=t_log,
                stderr=t_log,
                creationflags=creation_flags,
            )

    # خواندن لینک ایجاد شده از لاگ
    public_url = ""
    for _ in range(25):
        if tunnel_log.exists():
            try:
                content = tunnel_log.read_text(encoding="utf-8", errors="ignore")
                for line in content.splitlines():
                    if "trycloudflare.com" in line:
                        for word in line.split():
                            if word.startswith("https://") and "trycloudflare.com" in word:
                                public_url = word.strip().strip("|").strip()
                                break
            except Exception:
                pass
        if public_url:
            break
        time.sleep(0.5)

    if public_url and DESKTOP_DIR.exists():
        # ۱. ذخیره فایل متنی با لینک آنلاین
        info_txt = DESKTOP_DIR / "لینک_اینترنتی_مرکز_آپدیت.txt"
        info_content = (
            "=====================================================\n"
            "   لینک اینترنتی سراسری مرکز آپدیت سپهریار\n"
            "   (قابل باز شدن از هر جا، بدون نیاز به شبکه محلی)\n"
            "=====================================================\n\n"
            f"آدرس وب‌سایت:\n{public_url}\n\n"
            "آدرس شبکه داخلی (آفلاین):\nhttp://192.168.10.190:3000\n"
            "http://localhost:3000\n\n"
            "پشتیبانی از دانلود و آپلود تا ۱ گیگابایت\n"
        )
        info_txt.write_text(info_content, encoding="utf-8")

        # ۲. فایل URL اینترنتی با کلیک مستقیم
        url_file = DESKTOP_DIR / "ورود به مرکز آپدیت (اینترنتی).url"
        url_file.write_text(f"[InternetShortcut]\nURL={public_url}\n", encoding="utf-8")


def create_shortcuts():
    if not DESKTOP_DIR.exists():
        return

    import base64
    import shutil

    # ۱. شورت‌کات دسکتاپ با تکنیک نام‌گذاری موقت انگلیسی و تغییر به فارسی
    desktop_lnk = DESKTOP_DIR / "مرکز آپدیت و دانلود سپهریار.lnk"
    temp_desk_lnk = DESKTOP_DIR / "_temp_up_desk.lnk"

    # ۲. شورت‌کات استارتاپ ویندوز
    startup_lnk = STARTUP_DIR / "Sepehryar_Up_Service.lnk"

    ps_script = f"""
    $WshShell = New-Object -ComObject WScript.Shell
    
    $sc = $WshShell.CreateShortcut('{str(temp_desk_lnk)}')
    $sc.TargetPath = '{str(PYTHONW_EXE)}'
    $sc.Arguments = '"{str(UP_DIR / "run_sepehryar_up.py")}" --open'
    $sc.WorkingDirectory = '{str(UP_DIR)}'
    $sc.Description = 'Sepehryar Update Center'
    $sc.Save()

    $sc2 = $WshShell.CreateShortcut('{str(startup_lnk)}')
    $sc2.TargetPath = '{str(PYTHONW_EXE)}'
    $sc2.Arguments = '"{str(UP_DIR / "run_sepehryar_up.py")}"'
    $sc2.WorkingDirectory = '{str(UP_DIR)}'
    $sc2.Description = 'Sepehryar Update Service'
    $sc2.Save()
    """

    try:
        ps_bytes = ps_script.encode("utf-16le")
        ps_b64 = base64.b64encode(ps_bytes).decode("ascii")
        proc = subprocess.run(["powershell", "-NoProfile", "-EncodedCommand", ps_b64], capture_output=True, timeout=12)
        if temp_desk_lnk.exists():
            if desktop_lnk.exists():
                try:
                    desktop_lnk.unlink()
                except Exception:
                    pass
            shutil.move(str(temp_desk_lnk), str(desktop_lnk))
    except Exception:
        pass


def main():
    start_server_background()
    start_cloudflared_tunnel()
    create_shortcuts()

    # اگر کاربر با کلیک روی شورت‌کات اجرا کرده بود، مرورگر را باز کن
    if "--open" in sys.argv:
        webbrowser.open("http://localhost:3000")


if __name__ == "__main__":
    main()
