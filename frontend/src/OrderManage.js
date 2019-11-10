import React from "react";
import { PageHeader, Spin, Card, Button, Icon, Modal, message } from "antd";
import Axios from "axios";
import io from "socket.io-client";
import produce from "immer";


class Order extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      orders: null,
      curClickId: -1,
      deleteLoading:false,
    }
  }

  componentDidMount() {

    if (this.props.location.state === undefined) {
      this.props.history.push("/manager/manage");
    } else {
      const rid = this.props.location.state.id;
      this.socket = io("/order", {
        query: {
          rid,
        }
      });
      const socket = this.socket;
      socket.on("newOrder", (newOrder) => {
        // console.log(newOrder);
        // console.log(this.state.orders);
        this.setState(produce(state => {
          state.orders.unshift(newOrder);
        }))
        message.info('您有新订单啦！');
      })
      Axios.get(`/api/restaurant/${rid}/order`).then(res => {
        this.setState(produce(state => {
          state.orders = res.data;
        }))
        // this.setState({
        //   ...this.state,
        //   orders: res.data
        // })
      })
    }
  }
  componentWillUnmount() { 
    this.socket.close();
  }
  deleteOrder = (order) => {
    const rid = this.props.location.state.id;
    Modal.confirm({
      content: `确认删除桌号为【${order.deskname}】的订单?`,
      okText: "删除",
      cancelText: "取消",
      centered: true,
      confirmLoading:this.state.deleteLoading,
      onOk: () => {
        return new Promise(resolve => {
          this.setState(produce(state => {
            state.deleteLoading = true
          }))
          Axios.delete(`/api/restaurant/${rid}/order/${order.id}`).then((res) => {
            if (res.data.code) {
              this.setState(produce(state => {
                state.orders = this.state.orders.filter(it => {
                  return it.id !== order.id;
                })
                state.deleteLoading = true
              }))
              resolve()
            }
          })
        })
      }
    })
  }
  onConfirm = (order) => {
    const rid = this.props.location.state.id;
    this.setState(produce(state => {
      state.curClickId =  order.id
    }))
    Axios.put(`/api/restaurant/${rid}/order/${order.id}`, {
      newStatus: "completed"
    }).then(res => {
      if (res.data.code === 1) {
        this.setState({
          curClickId: -1,
          orders: this.state.orders.map(it => {
            if (it.id === order.id) {
              return {
                ...it,
                status: "completed"
              }
            }
            return it;
          })
        })
        this.curClickId = -1;
      }
    })
  }


  render() {
    // console.log(this.state.orders);
    return (
      <div>
        <PageHeader
          style={{
            border: '1px solid rgb(235, 237, 240)',
          }}
          onBack={() => this.props.history.go(-1)}
          title="订单管理"
        />
        {
          this.state.orders !== null  ?
            this.state.orders.slice().sort((a, b) => {  //FK THIS
              if (a.status === b.status) {
                if (new Date(a.timestamp) > new Date(b.timestamp)) {
                  return -1;
                } else {
                  return 1;
                }
              } else {
                if (a.status === "pending") {
                  return -1;
                } else {
                  return 1;
                }
              }
            }).map(order =>
              <OrderItem
                order={order}
                key={order.id}
                onDelete={this.deleteOrder}
                onConfirm={this.onConfirm}
                curClickId={this.state.curClickId}
              />)
            :
            <div style={{ textAlign: "center" }}>
              <Spin />
            </div>
        }
      </div>
    )
  }
}


function OrderItem({ order, onDelete, onConfirm, curClickId }) {
  return (
    <Card title={order.deskname + "号桌"} extra={<Button onClick={() => onDelete(order)}>删除</Button>} style={{ margin: "10px 0" }}>
      <p>用餐人数：<strong>{order.customerCount}</strong>人</p>
      <p><strong>菜品/单价/份数</strong></p>
      {
        order.details.map((f, idx) => {
          return (
            <p key={idx}>
              <strong>{f.name}</strong>
              ------
              {f.price}元/份
              ------
              <strong>{f.amount}份</strong>
            </p>
          )
        })
      }
      <p>总价格：{order.totalPrice}元</p>
      <p>下单时间：{new Date(order.timestamp).toLocaleString()}</p>
      <p>状态：<strong>{order.status === "pending" ? "处理中" : "已完成"}</strong></p>
      {
        order.status === "pending" &&
        <Button type="primary" onClick={() => onConfirm(order)}>
          {
            order.id === curClickId &&
            <Icon type="loading" />
          }
          完成订单
        </Button>
      }

    </Card>
  )
}


export default Order;