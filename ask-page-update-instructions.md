# AI 问答页（AnythingLLM 嵌入）统一更新指令

可整段复制给另外两个网站的 AI 助手使用。把「美嘉」替换成该站的 AI 助手名称。

## 任务
修改 ask.html（AI 对话页）。只做下面 5 项，不改 AI 对话逻辑、API、数据库、登录或其他页面。优先使用 AnythingLLM 官方的 data- 属性配置，不要修改第三方源码。

## 1. 输入框改中文
在嵌入 `<script data-embed-id=...>` 标签上加：

    data-send-message-text="今天想和美嘉聊些什么？"

## 2. 空对话提示改中文，并加每日随机引导语
空对话提示 “Send a chat to get started.” 没有官方设置项。在页面里加一段脚本，用 MutationObserver 监听 `#chat-slot`（或聊天容器），出现该英文文本时：
- 改为“今天想从哪里开始？”
- 在其下方插入一个 `<p class="daily-prompt">`，显示当天的随机引导语（小字、浅色、居中）。

每日随机逻辑：用当天日期（年月日）做哈希，对提示语数组取模。同一天刷新不变，第二天自动更换，不调用 AI。提示语为本地数组，语气温柔、不使用“神”字，围绕感恩、敬畏、服务、成长（见本站 ask.html 的 PROMPTS 数组，共 24 句，可直接复制）。

## 3. 去掉 “Powered by AnythingLLM”
AnythingLLM 为 MIT 许可证，不强制显示该品牌。用官方配置，在同一个 script 标签上加：

    data-no-sponsor="true"

## 4. “Reset Chat” 改为“开始新的对话”
同一个 script 标签上加：

    data-reset-chat-text="开始新的对话"

## 5. “AI” 徽标：紫色底、白色字
主菜单和副标题中的 “AI” 都用同一个 class：

    <span class="ai-badge">AI</span>

在 style.css 加（若已有则核对）：

    .ai-badge {
      display: inline-block;
      font-size: 0.65em;
      font-weight: 700;
      line-height: 1;
      padding: 3px 6px;
      margin-left: 2px;
      border-radius: 6px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      vertical-align: middle;
      letter-spacing: 0.5px;
    }

若要纯紫色，把 background 改为 `#7c3aed`。副标题（hero 的 subtitle）里出现 “AI” 的地方也包上 `<span class="ai-badge">AI</span>`。

## 完整的 script 标签示例

    <script
      data-embed-id="（该站自己的 embed id）"
      data-base-api-url="https://（该站自己的域名）/api/embed"
      data-open-on-load="on"
      data-no-sponsor="true"
      data-send-message-text="今天想和美嘉聊些什么？"
      data-reset-chat-text="开始新的对话"
      src="https://（该站自己的域名）/embed/anythingllm-chat-widget.min.js">
    </script>

注意：embed id 和域名保持各站原有值，不要改。
