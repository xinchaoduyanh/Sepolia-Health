# Prompt & Policy Registry

Mọi persona/scope/refusal/few-shot nằm ở đây dưới dạng MD versioned. Đổi cách AI
nói chuyện = sửa MD + bump version + reload, KHÔNG sửa code Python.

## Frontmatter bắt buộc
```yaml
---
id: <unique>          # vd: scheduling-copilot
kind: system | policy | refusal | few_shot
locale: vi-VN
version: 1            # tăng dần, không downgrade
status: active | draft | deprecated   # mỗi id chỉ 1 version active
owner: dev-team
updated: 2026-06-10
---
```

## Bump version
1. Copy file `.v1.md` → `.v2.md`, sửa nội dung, đặt `version: 2`.
2. Đặt `status: deprecated` cho v1 (hoặc xóa nếu chắc chắn).
3. Thêm entry vào `_version-log.md`.
4. Reload registry (hoặc restart service).

## Loader
`app/prompts/loader.py` (`PromptRegistry`) bỏ qua file `_*.md` và `README.md`.
Placeholder `{{VAR}}` được render lúc runtime (CURRENT_YEAR, TODAY_VN, CALENDAR_STRIP...).
