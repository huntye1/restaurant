import React from "react";
import axios from "axios";
import { Modal, Spin, Divider, Button } from "antd";
import "./Manage.css"
import produce from "immer";

class Manage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userinfo: this.props.location.state,
      logoutLoading:false,
    }
  }
  componentDidMount() {
    if (this.state.userinfo === undefined) {
      axios.get("/api/userinfo").then(res => {
        if (res.data.code) {
          this.setState({
            userinfo: res.data.user
          })
        } else {
          Modal.info({
            content: "您尚未登录，请先登录！",
            okText: "登录",
            onOk: () => {
              this.props.history.push("/manager/login");
            }
          })
        }
      })
    }
  }
  logout = () => {
    console.log(this.state.logoutLoading);
    Modal.confirm({
      content: "确认登出吗？",
      okText: "登出",
      cancelText: "取消",
      centered:true,
      confirmLoading:this.state.logoutLoading,
      onOk: () => {
        return new Promise((resolve) => {
          this.setState(produce(state => {
            state.logoutLoading = true
          }))
          axios.get("api/logout").then(() => {
            this.setState(produce(state => {
              state.logoutLoading = false
            }))
            this.props.history.push("/manager/login")
            resolve();
          })
        })
      }
    })
  }
  itemsSwitch = (e) => {
    const name = e.target.className;
    this.props.history.push({
      pathname: "/manager/manage/" + name,
      state: this.state.userinfo
    });
  }
  render() {
    return (
      <div id="Manage"> 
        {
          this.state.userinfo
            ?
            <div>
              <h2>
                {this.state.userinfo.title}<br />
              </h2>
              <h3>
                管理员{this.state.userinfo.name}，你好
                <Button type="link" onClick={this.logout} size={"large"}>登出</Button>
              </h3>
              <Divider />
              <div className="items" onClick={this.itemsSwitch}>
                <div className="order">
                  订单管理
                </div>
                <div className="food">
                  菜单管理
                </div>
                <div className="desk">
                  桌面管理
                </div>
              </div>
            </div>
            :
            <Spin />
        }
      </div>
    )
  }
}



export default Manage; 