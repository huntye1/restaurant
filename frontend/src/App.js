import React, { Component } from 'react';
import { HashRouter, Switch, Route, Redirect } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Manage from "./Manage";

import OrderSuccess from "./OrderSuccess";
import Landing from "./Landing";
import Order from "./Order";

import "./App.css"

import OrderManage from "./OrderManage";
import FoodManage from "./FoodManage";
import DeskManage from "./DeskManage";


class App extends Component {

  render() {
    return (
      <div id="App">
        <HashRouter>
          <Switch>
            <Route path="/manager/login" component={Login}>
            </Route>
            <Route path="/manager/register" component={Register}>
            </Route>
            <Route path="/manager/manage/order" component={OrderManage}></Route>
            <Route path="/manager/manage/food" component={FoodManage}></Route>
            <Route path="/manager/manage/desk" component={DeskManage}></Route>
            <Route path="/manager/manage" component={Manage}>
            </Route>

            <Route path="/customer/r/:rid/d/:did/order-success" component={OrderSuccess}>
            </Route>
            <Route path="/customer/r/:rid/d/:did/landing" component={Landing}>
            </Route>
            <Route path="/customer/r/:rid/d/:did/order" component={Order}>
            </Route>
            <Redirect to="/manager/login" />
          </Switch>
        </HashRouter>
      </div>
    )
  }
}


export default App;