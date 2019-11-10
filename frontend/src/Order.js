import React, { useState } from "react";
import produce from "immer";
import Axios from "axios";
import { Card, Spin, Badge, Typography, Divider, Icon, Modal } from "antd";
import "./Order.css"
import { Button } from "antd/lib/radio";
import io from "socket.io-client";
const { Title, Text } = Typography;

class Order extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      foods: null,
      info: null,
      checkOutLoading: false
    }
  }
  componentDidMount() {
    const { rid, did } = this.props.match.params;
    if (!this.props.location.state) {
      this.props.history.push(`/customer/r/${rid}/d/${did}/landing`)
    } else {
      const curOrderedFoods = this.props.location.state.curOrderedFoods;

      this.socket = io("/food", {
        query: {
          type: "sync",
          rid,
          did
        }
      });

      const socket = this.socket;
      const customerCount = this.props.location.state.customerCount;

      socket.on("getOrderInfo", (id) => {
        socket.emit("orderedInfo", {
          foods: this.state.foods,
          customerCount,
          id,
          deskInfo: this.state.info,
        });
      })

      socket.on("plusFood", (food) => {
        let idx = this.state.foods.findIndex(it => it.id === food.id);
        this.setState(produce(state => {
          state.foods[idx].amount++;
        }))
      })

      socket.on("minusFood", (food) => {
        let idx = this.state.foods.findIndex(it => it.id === food.id);
        this.setState(produce(state => {
          state.foods[idx].amount--;
        }))
      })

      socket.on("checkout", () => {
        this.props.history.push(`/customer/r/${rid}/d/${did}/order-success`);
      })

      if (curOrderedFoods.length > 0) {
        this.setState(produce(state => {
          state.foods = curOrderedFoods;
        }))
      } else {
        Axios.get(`/api/foodinfo/restaurant/${rid}`).then(res => {
          if (res.data.code) {
            this.setState(produce(state => {
              state.foods = res.data.foodInfo.map(it => {
                return {
                  ...it,
                  amount: 0
                }
              })
            }))
          }
        })
      }

      this.setState(produce(state => {
        state.cutomerCount = this.props.location.state.cutomerCount;
        state.info = this.props.location.state.info;
      }))
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.close()
    }
  }

  plusFood = (food) => {
    let idx = this.state.foods.findIndex(it => it.id === food.id);
    this.socket.emit("plusFood", food)
    this.setState(produce(state => {
      state.foods[idx].amount += 1;
    }))
  }
  minusFood = (food) => {
    if (food.amount === 0) {
      return
    }
    let idx = this.state.foods.findIndex(it => it.id === food.id);
    this.socket.emit("minusFood", food)
    this.setState(produce(state => {
      state.foods[idx].amount -= 1;
    }))
  }
  totalPrice = () => {
    return this.state.foods.reduce((total, food) => {
      return total + food.price * food.amount;
    }, 0);
  }
  checkOut = () => {
    if (this.totalPrice() === 0) {
      return;
    }
    Modal.confirm({
      content: "确认下单吗？",
      confirmLoading: this.state.checkOutLoading,
      okText: "下单",
      cancelText: "取消",
      centered: true,
      onOk: () => {
        return new Promise(resolve => {
          this.setState(produce(state => {
            state.checkOutLoading = true;
          }))
          let orderedFood = this.state.foods.filter(food => food.amount !== 0).map(food => {
            return {
              id: food.id,
              price: food.price,
              name: food.name,
              amount: food.amount
            }
          })
          const { rid, did } = this.props.match.params;
          const deskName = this.props.location.state.info.deskName;
          const customerCount = this.props.location.state.customerCount;
          Axios.post(`/api/restaurant/${rid}/desk/${did}/order`, {
            details: orderedFood,
            totalPrice: this.totalPrice(),
            customerCount,
            deskName,
            rid,
            did,
          }).then(res => {
            this.setState(produce(state => {
              state.checkOutLoading = true;
            }))
            if (res.data.code) {
              this.socket.emit("checkout");
              this.props.history.push(`/customer/r/${rid}/d/${did}/order-success`);
            }
            resolve()
          })
        })
      }
    })


  }
  cartFoods = () => {
    return this.state.foods.filter(it => it.amount !== 0);
  }
  render() {
    return (
      <div id="Order">{
        this.state.foods !== null ?
          <div>
            <Title level={2} className="title">{this.state.info.title}，欢迎您点餐</Title>
            <Divider />
            <Foods
              foods={this.state.foods}
              plusFood={this.plusFood}
              minusFood={this.minusFood}
            />
            <ShopCart
              totalPrice={this.totalPrice()}
              checkOut={this.checkOut}
              cartFoods={this.cartFoods()}
              plusFood={this.plusFood}
              minusFood={this.minusFood}
            />
          </div>
          :
          <div className="loading">
            <Spin />
          </div>
      }
      </div>
    )
  }
}

function Foods({ foods, plusFood, minusFood }) {
  return (
    <div id="foods">
      {
        foods.map(food => {
          return (
            <FoodItem key={food.id} food={food} plusFood={plusFood} minusFood={minusFood}></FoodItem>
          )
        })
      }
    </div>
  )
}

function FoodItem({ food, plusFood, minusFood }) {
  return (
    <div className="foodItem">
      <Card
        title={food.name}
        extra={
          <div>
            <Icon type="minus" onClick={() => minusFood(food)} />
            <Divider type="vertical" />
            <Text className="amount">{food.amount}</Text>
            <Divider type="vertical" />
            <Icon type="plus" onClick={() => plusFood(food)} />
          </div>
        }
      >
        <img src={`/uploads/` + food.image} alt={food.name} />
        <p><Text>描述：{food.description}</Text></p>
        <p><Text>分类：{food.category}</Text></p>
        <p><Text>价格：{food.price} 元</Text></p>
      </Card>
    </div>
  )
}


function ShopCart({ totalPrice, checkOut, cartFoods, plusFood, minusFood }) {
  const [showMyCart, setShowMyCart] = useState(false);

  const display = showMyCart ? "block" : "none";
  return (
    <div id="ShopCart">
      {
        <ul className="myCart" style={{display}}>
          <Icon type="close" className="close" onClick={() => setShowMyCart(false)}/> 
          {
            cartFoods.map(food => {
              return (
                <li key={food.id} className="myCartFoodItem">
                  <img alt={food.name} src={"/uploads/" + food.image} />
                  <Divider type="vertical" />
                  {food.name}
                  <span className="fr">
                    {food.price}元/份
                    <Divider type="vertical" />
                    <div className="buttons">
                      <Icon type="minus" onClick={() => minusFood(food)} />
                      <Divider type="vertical" />
                      <Text className="amount">{food.amount}</Text>
                      <Divider type="vertical" />
                      <Icon type="plus" onClick={() => plusFood(food)} />
                    </div>
                  </span>
                </li>
              )
            })
          }
        </ul>
      }
      <Badge count={cartFoods.length} className="shoppingCart" onClick={() => setShowMyCart(!showMyCart)}>
        <Icon type="shopping-cart" />
      </Badge>
      <span className="totalPrice">总价格:{totalPrice}元</span>
      <Button className="checkout" style={totalPrice > 0 ? { color: "white", backgroundColor: "#1890ff" } : {}} onClick={checkOut}>去下单</Button>
    </div>
  )
}



export default Order; 