import React from "react";
import { Form, Input, Icon, Button,Modal } from "antd";
import Axios from "axios";

class registerForm extends React.Component {
  state = {
    isRegisting: false
  }
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        // console.log('Received values of form: ', values);
        this.setState({
          isRegisting:true
        })
        Axios.post("/api/register", values).then(res => {
          this.setState({
            isRegisting: false
          })
          if (res.data.code) {
            Modal.success({
              content: "注册成功！",
              okText: "确认",
              centered: true,
              onOk: () => {
                this.props.history.push({
                  pathname: "/manager/login",
                })
              }
            })
          } else {
            Modal.error({
              content: "用户名已存在！",
              okText: "确认",
              centered: true,
              onOk: () => {
                this.props.form.resetFields(["name", "password"]);
                this.setState({
                  isRegisting: false
                })
              }
            })
          }
        })
      }
    });
  }
  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div>
        <div id="Login">
          <Form onSubmit={this.handleSubmit} className="login-form">
            <h2>注册你的管理员账号</h2>
            <Form.Item>
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入你的用户名！' }],
              })(
                <Input
                  prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="用户名"
                />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('password', {
                rules: [{ required: true, message: '请输入你的密码！' }],
              })(
                <Input
                  prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                  type="password"
                  placeholder="密码"
                />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('title', {
                rules: [{ required: true, message: '请输入你的餐厅名字！' }],
              })(
                <Input
                  prefix={<Icon type="shop" style={{ color: 'rgba(0,0,0,.25)' }} />}
                  placeholder="餐厅名"
                />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('email', {
                rules: [{ required: true, message: '请输入你的邮箱！' }],
              })(
                <Input
                  prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />}
                  type="email"
                  placeholder="邮箱"
                />,
              )}
            </Form.Item>
            <Button htmlType="submit" type="primary" block>
              {
                this.state.isRegisting&& 
                <Icon type="loading"/>
              }
              注册
            </Button>
          </Form>
        </div>
      </div>
    )
  }

}

const WrappedRegisterForm = Form.create({})(registerForm);


export default WrappedRegisterForm; 