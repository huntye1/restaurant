import React from "react";
import Axios from "axios";
import produce from "immer";
import { Spin, Card, Typography, Divider, Button } from "antd";
import "./Landing.css";
import _ from "lodash";
import io from "socket.io-client";

const { Title } = Typography;


class Landing extends React.Component {
  constructor(props) {
    super(props);
    const { rid, did } = this.props.match.params;
    this.state = {
      info: null,
      rid: rid,
      did: did,
      customerCount:0,
      curOrderedFoods: [],
    }
  }
  componentDidMount() {
    const rid = this.state.rid;
    const did = this.state.did;
    this.socket = io("/food", {
      query: {
        type: "init",
        rid,
        did,
      }
    })

    const getInfo = () => {
      Axios.get(`/api/deskinfo/restaurant/${rid}/desk/${did}`).then(res => {
        if (res.data.code) {
          this.setState(produce(state => {
            state.info = res.data.info
          }))
        }
      })
    }

    this.socket.on("initInfo", (info) => {   
      console.log("initInfo",info)
      this.setState(produce(state => {
        state.curOrderedFoods = info.foods;
        state.customerCount = info.customerCount;
        state.info = info.deskInfo
      }));
      this.startOrder();
    })

    this.socket.on("noOrderedFoods", () => {   // 没有已经在点的食物
      getInfo();
    })


  }

  componentWillUnmount() { 
    this.socket.close();
  }

  setCustomerCount = (count, e) => {
    e.persist();
    _.forEach(e.target.parentElement.children, it => it.classList.remove("active"));
    e.target.classList.add("active")
    this.setState(produce(state => {
      state.customerCount = count;
    }))
  }

  startOrder = () => {
    const { rid, did, customerCount, info, curOrderedFoods } = this.state;
    this.props.history.push({
      pathname: `/customer/r/${rid}/d/${did}/order`,
      state: {
        customerCount,
        info,
        curOrderedFoods,
      }
    })
  }

  render() {
    const info = this.state.info;

    return (
      <div id="Landing">
        {
          info ? 
            <Card>
              <Title level={2} style={{textAlign:"center"}}>欢迎光临，{info.title}</Title>
              <Title level={3} style={{ textAlign: "center" }}>您的桌号为：{info.deskName}</Title>
              <Divider />
              <Title level={4}>请选择您的用餐人数：</Title>
              <div style={{display:"flow-root"}}>
                  {
                  Array(info.capacity).fill(0).map((_, idx) => <div span={5} key={idx} onClick={(e) => this.setCustomerCount(idx + 1,e)} className="countItem">{idx + 1}</div> )
                  }
              </div>
              {
                this.state.customerCount > 0 &&
                <Button type="primary" className="startButton" onClick={this.startOrder}>开始点餐</Button>

              }
            </Card>
            :
            <div style={{ textAlign: "center" }}>
              <Spin /> 
            </div>
        }
      </div>
    )
  }
}



export default Landing; 