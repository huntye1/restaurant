import React from "react";
import { Form, Icon, Input, Button, Checkbox, Modal} from 'antd';
import "./Login.css";
import { Link } from "react-router-dom";
import axios from "axios";

class NormalLoginForm extends React.Component {

  state = {
    isLoading:false
  }

  componentDidMount() { 
    axios.get("/api/userinfo").then(res => {
      if (res.data.code) {
        Modal.confirm({
          content: "您已经登录，是否跳转管理界面？",
          centered: true,
          okText: "确认",
          cancelText: "重新登录",
          onOk: () => {
            this.props.history.push({
              pathname: "/manager/manage",
              state:res.data.user
            })
          },
        })
      }
    })
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        // console.log('Received values of form: ', values);
        this.setState({
          isLoading:true
        })
        axios.post("/api/login", values).then(res => {
          if (res.data.code) {
            this.setState({
              isLoading: false
            })
            Modal.success({
              content: "登录成功！",
              okText: "确认",
              centered: true,
              onOk: () => {
                this.props.history.push({
                  pathname: "/manager/manage",
                  state: res.data.user
                })
              }
            })
          } else {
            Modal.error({
              content: "账号或密码错误！",
              okText: "确认",
              centered: true,
              onOk: () => {
                this.props.form.resetFields("password")
              }
            })
          }
        })
      }
    });
  };


  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div id="Login">
        <Form onSubmit={this.handleSubmit} className="login-form">
          <h2>管理员登陆</h2>
          <Form.Item>
            {getFieldDecorator('username', {
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
            {getFieldDecorator('remember', {
              valuePropName: 'checked',
              initialValue: true,
            })(<Checkbox>记住我</Checkbox>)}
            <Button type="primary" htmlType="submit" className="login-form-button">
              {
                this.state.isLoading &&
                <Icon type="loading" />
              }
              登录
            </Button>
            没有账号？<Link to="/manager/register">点击注册</Link>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

const WrappedNormalLoginForm = Form.create({})(NormalLoginForm);


export default WrappedNormalLoginForm; 