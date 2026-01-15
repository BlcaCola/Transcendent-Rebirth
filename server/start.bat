@echo off
chcp 65001 >nul
echo ============================================
echo   超凡新生后端服务 - Windows 启动脚本
echo ============================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Python，请先安装 Python 3.9+
    pause
    exit /b 1
)

echo Python 已安装
echo.

REM 检查是否存在虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
    echo 虚拟环境创建成功
    echo.
)

REM 激活虚拟环境并安装依赖
echo 检查虚拟环境...
call venv\Scripts\activate.bat

REM 安装依赖
echo 安装依赖包...
set PYTHONIOENCODING=utf-8
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo 依赖安装失败
    pause
    exit /b 1
)
echo 依赖安装成功
echo.

REM 检查 .env 文件
if not exist ".env" (
    echo 未找到 .env 文件，复制示例配置...
    copy .env.example .env
    echo 已创建 .env 文件，请根据需要修改配置
    echo.
)

REM 切换到项目根目录启动服务
cd ..
echo 启动后端服务...
echo.
echo ============================================
echo   访问地址:
echo   - API 文档: http://localhost:12345/docs
echo   - 管理后台: http://localhost:12345/admin
echo   - 健康检查: http://localhost:12345/health
echo ============================================
echo.
echo 按 Ctrl+C 停止服务
echo.

server\venv\Scripts\python.exe -m uvicorn server.main:app --host 0.0.0.0 --port 12345

pause
