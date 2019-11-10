# 点餐系统

实现简单的餐厅点餐系统。前端使用React，后端使用Express，数据库使用SQLite，UI库使用Ant Design。主要功能：管理员账号登陆、注册与登出，订单系统的状态管理、删除功能以及顾客下单后的实时通知与订单更新，菜品系统的菜品增加、删除、更改功能，桌面系统的增加、更改、生成二维码功能；顾客点餐有实时价格预览、购物车显示已加入商品，以及多人点餐的菜品同步功能。

💡tip：建议**手机预览**，管理员体验**账号密码均为b。**

管理员👇👇👇    

![img](data:image/png;base64,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)

点餐👇👇👇

![img](data:image/png;base64,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)

> [在线地址](http://restaurant.wenm.me)  [代码地址](https://github.com/huntye1/restaurant)