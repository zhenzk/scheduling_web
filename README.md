# 排班系统 - 独立前端版本（最终修复版）

这是一个基于FastAPI和React的排班系统，支持在后端服务不可用时以游客身份浏览系统。此版本修复了所有路由和依赖问题，确保前端可以独立运行。

## 主要功能

- **用户管理**：支持管理员、白班和夜班人员角色
- **排班管理**：支持工作日和假期班次，自动排班和手动调整
- **调班协作**：支持调班申请、审批流程，需双方同意
- **通知系统**：实时通知用户相关事件和消息
- **游客模式**：后端服务不可用时，可以以游客身份浏览系统

## 技术栈

### 前端
- React 18
- TypeScript
- Redux Toolkit (状态管理)
- RTK Query (API请求)
- Ant Design (UI组件库)
- Tailwind CSS (样式)
- Vite (构建工具)
- React Router (路由)

### 后端
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL (数据库)
- JWT (认证)
- Alembic (数据库迁移)

## 游客模式特性

当后端服务不可用时，系统提供以下功能：

1. **游客登录**：在登录页面点击"以游客身份浏览"按钮
2. **模拟数据**：使用预设的模拟数据展示系统功能
3. **状态提示**：清晰显示当前处于游客模式，并提示哪些功能不可用
4. **只读操作**：支持查看排班表、调班申请等信息，但不支持创建、修改或删除操作

## 最终修复说明

此版本修复了以下问题：

1. **添加缺失文件**：
   - 创建了缺失的`index.html`文件（Vite应用的入口点）
   - 创建了缺失的`public`目录（静态资源目录）

2. **添加缺失依赖**：
   - 安装了缺失的`react-router-dom`依赖（路由功能必需）

3. **路由配置优化**：
   - 使用HashRouter替代BrowserRouter，避免刷新页面时的404错误
   - 优化Vite配置，设置base路径为'./'，确保资源正确加载

4. **默认路由调整**：
   - 将默认路由设置为登录页面，提升用户体验

## 快速开始

### 前端开发环境设置

1. 安装依赖：
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 访问前端应用：
   打开浏览器访问 http://localhost:5173
   
   > 注意：由于使用了HashRouter，URL中会包含#符号，如http://localhost:5173/#/login

### 后端开发环境设置（可选）

如果您需要完整功能，可以设置后端环境：

1. 创建Python虚拟环境：
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或
   venv\Scripts\activate  # Windows
   ```

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 设置环境变量：
   创建`.env`文件，包含以下内容：
   ```
   DATABASE_URL=postgresql://username:password@localhost/dbname
   SECRET_KEY=your_secret_key
   ```

4. 运行数据库迁移：
   ```bash
   alembic upgrade head
   ```

5. 启动后端服务：
   ```bash
   uvicorn app.main:app --reload
   ```

## 使用游客模式

1. 启动前端应用（无需启动后端）
2. 在登录页面点击"以游客身份浏览"按钮
3. 系统将自动以游客身份登录，并显示模拟数据
4. 页面顶部会显示"游客模式"和"后端未连接"标识
5. 尝试执行写入操作时，系统会提示"游客模式下无法执行此操作"

## Docker部署（可选）

如果您希望使用Docker部署完整系统：

1. 构建并启动容器：
   ```bash
   docker-compose up -d
   ```

2. 访问应用：
   打开浏览器访问 http://localhost:3000

## 项目结构

```
scheduling-system/
├── backend/                # 后端代码
│   ├── app/                # 应用代码
│   │   ├── api/            # API端点
│   │   ├── core/           # 核心配置
│   │   ├── db/             # 数据库配置
│   │   ├── models/         # 数据库模型
│   │   └── schemas/        # Pydantic模式
│   ├── migrations/         # 数据库迁移
│   └── requirements.txt    # 依赖列表
│
├── frontend/               # 前端代码
│   ├── index.html          # 应用入口HTML
│   ├── public/             # 静态资源
│   ├── src/                # 源代码
│   │   ├── components/     # 组件
│   │   ├── layouts/        # 布局组件
│   │   ├── mock/           # 模拟数据
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── store/          # Redux状态
│   │   └── utils/          # 工具函数
│   ├── package.json        # 依赖配置
│   └── vite.config.ts      # Vite配置
│
└── docker-compose.yml      # Docker配置
```

## 游客模式实现说明

游客模式通过以下方式实现：

1. **模拟数据**：在`frontend/src/mock/`目录中定义了各种模拟数据
2. **后端状态检测**：`api.ts`中的`checkBackendAvailability`函数检测后端是否可用
3. **条件渲染**：各组件根据后端状态和用户角色显示不同内容
4. **操作限制**：游客模式下禁用写入操作，并显示提示信息

## 常见问题

1. **依赖安装失败**
   - 使用`--legacy-peer-deps`标志安装依赖：`npm install --legacy-peer-deps`

2. **"Missing script: 'start'"错误**
   - 使用`npm run dev`命令启动前端服务

3. **页面显示404错误**
   - 确保使用正确的URL路径，默认路径为`/#/login`（注意#符号）
   - 确保项目中包含index.html文件
   - 确保已安装react-router-dom依赖
   - 如果仍有问题，尝试清除浏览器缓存或使用不同浏览器

4. **游客模式下无法执行某些操作**
   - 这是预期行为，游客模式仅支持只读操作
   - 如需完整功能，请启动后端服务

## 联系与支持

如有任何问题或需要支持，请联系系统管理员。
