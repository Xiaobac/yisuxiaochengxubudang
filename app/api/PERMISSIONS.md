# 系统权限列表 (Permissions)

该文档记录了系统中当前使用的所有权限类型。这些权限名称必须与数据库 `Permission` 表中的 `name` 字段一致。

## 酒店管理 (Hotel Management)

*   `HOTEL_AUDIT`
    *   **描述**: 允许审核酒店状态（如：批准上线、驳回、强制下线等）。
    *   **用途**: 用于管理员审核商户创建的酒店。
    
*   `HOTEL_DELETE`
    *   **描述**: 允许删除任何酒店。
    *   **用途**: 用于管理员进行内容管理。
    *   **备注**: 酒店拥有者本身有权删除自己的酒店，不需要此权限。

## 用户管理 (User Management)

*   `USER_READ`
    *   **描述**: 允许查看所有用户列表。
    *   **用途**: 用于管理员查看平台用户统计。

*   `USER_UPDATE`
    *   **描述**: 允许修改其他用户的信息。
    *   **用途**: 用于管理员协助用户重置信息或管理违规商户。
    *   **备注**: 用户本人有权修改自己的信息，不需要此权限。

*   `USER_DELETE`
    *   **描述**: 允许删除其他用户的账户。
    *   **用途**: 用于管理员封禁违规用户。
    *   **备注**: 用户本人有权注销自己的账户，不需要此权限。

## 标签管理 (Tag Management)

*   `TAG_CREATE`
    *   **描述**: 允许创建新的标签。
    *   **用途**: 用于管理员维护系统标签库。

*   `TAG_UPDATE`
    *   **描述**: 允许修改现有标签的名称。
    *   **用途**: 用于管理员修正标签信息。

*   `TAG_DELETE`
    *   **描述**: 允许删除标签。
    *   **用途**: 用于管理员清理不再使用的标签。

## 位置管理 (Location Management)

*   `LOCATION_CREATE`
    *   **描述**: 允许创建新的地理位置。
    *   **用途**: 用于管理员扩展平台覆盖区域。

*   `LOCATION_UPDATE`
    *   **描述**: 允许修改现有位置的信息。
    *   **用途**: 用于管理员更新位置描述。

*   `LOCATION_DELETE`
    *   **描述**: 允许删除地理位置。
    *   **用途**: 用于管理员移除不再支持的区域。

## 角色说明 (Role Reference)

*   `USER` (普通用户)
    *   通常不具备上述特殊权限。
    
*   `MERCHANT` (商户)
    *   通常拥有管理自己创建的酒店的权利，但不具备全局管理权限。

*   `ADMIN` (管理员)
    *   应当配置上述所有权限 (`HOTEL_AUDIT`, `HOTEL_DELETE`, `USER_READ`, `USER_UPDATE`, `USER_DELETE`, `TAG_CREATE`, `TAG_UPDATE`, `TAG_DELETE`, `LOCATION_CREATE`, `LOCATION_UPDATE`, `LOCATION_DELETE`)。
