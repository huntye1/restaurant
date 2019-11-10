import React from "react";
import { Result,Button } from "antd";

function OrderSuccess(props) {
  return (
    <Result
      status="success"
      title="下单成功！"
      subTitle="我们正在努力准备你的美食哦~请稍后~"
      extra={[
        <Button key="buy" onClick={() => {
          props.history.go(-1);
        }}>继续点餐</Button>,
      ]}
    />
  )
}

export default OrderSuccess; 