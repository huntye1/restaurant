import React from "react";
import { PageHeader, Modal, Spin, Card, Button, Icon, Form, Input, InputNumber } from "antd";
import Axios from "axios";
import produce from "immer";
import QRCode from "qrcode.react";

class Desk extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      desks: null,
      visible: false,
      curEditDesk: null,
      QRCodeVisible: false,
      QRCodeInfo: {},
      confirmLoading:false,
      deleteLoading: false,
    }
  }

  componentDidMount() {
    if (this.props.location.state === undefined) {
      this.props.history.push("/manager/manage");
    } else {
      const rid = this.props.location.state.id;
      Axios.get(`/api/restaurant/${rid}/desk`).then(res => {
        if (res.data.code) {
          this.setState(produce(state => {
            state.desks = res.data.desks
          }))
        }
      })
    }
  }

  handleDeleteDesk = (desk) => {
    const rid = this.props.location.state.id;
    Modal.confirm({
      content: `确认删除桌子${desk.name}?`,
      okText: "删除",
      cancelText: "取消",
      centered: true,
      confirmLoading:this.state.deleteLoading,
      onOk: () => {
        return new Promise((resolve) => {
          this.setState(produce(state => {
            state.confirmLoading = true
          }))
          Axios.delete(`/api/restaurant/${rid}/desk/${desk.id}`).then((res) => {
            if (res.data.code) {
              this.setState(produce(state => {
                state.desks = this.state.desks.filter(it => it.id !== desk.id);
                state.confirmLoading = false;
              }))
              resolve();
            }
          })
        })
      }
    })
  }
  handleEditDesk = (desk) => {
    this.setState(produce(state => {
      state.visible = true;
      state.curEditDesk = desk;
    }))
  }
  onCancel = () => {
    this.setState(produce(state => {
      state.visible = false;
      state.curEditDesk = null;
    }))
  }
  onChange = (desk) => {
    const { form } = this.formRef.props;
    const rid = this.props.location.state.id;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      // console.log('Received values of form: ', values);
      if (desk === null) {
        this.setState(produce(state => {
          state.confirmLoading = true;
        }));
        Axios.post(`/api/restaurant/${rid}/desk`, values).then(res => {
          if (res.data.code) { 
            this.setState(produce(state => {
              state.desks.unshift(res.data.newDesk);
              state.visible = false;
              state.confirmLoading = false;
            }), () => {
              setTimeout(() => {
                this.setState(produce(state => {
                  state.curEditDesk = null
                }))
                form.resetFields();
              }, 100)
            })
          }
        })
      } else { 
        this.setState(produce(state => {
          state.confirmLoading = true;
        }));
        Axios.put(`/api/restaurant/${rid}/desk/${desk.id}`, values).then(res => {
          if (res.data.code) {
            let idx = this.state.desks.findIndex(it => it.id === desk.id);
            this.setState(produce(state => {
              state.desks[idx] = res.data.newDesk;
              state.visible = false;
              state.confirmLoading = false;
            }), () => {
              setTimeout(() => {
                this.setState(produce(state => {
                  state.curEditDesk = null
                  }))
                  form.resetFields();
                },100)
            })
          }
        })
      }
    });
  }
  saveFormRef = formRef => {
    this.formRef = formRef;
  };

  showQRCode = (desk) => {
    const rid = this.props.location.state.id;
    this.setState(produce(state => {
      state.QRCodeInfo = {
        rid,
        did: desk.id,
      }
      state.QRCodeVisible = true;
    }))

  }
  handleQRCodeCancel = () => {
    this.setState(produce(state => {
      state.QRCodeVisible = false;
    }))
  }
  handleAddDesk = () => {
    this.setState(produce(state => {
      state.visible = true;
    }))
  }
  render() {
    return (
      <div>
        <PageHeader
          style={{
            border: '1px solid rgb(235, 237, 240)',
          }}
          onBack={() => this.props.history.go(-1)}
          title="桌面管理"
        />
        <Card style={{ fontSize: "30px",textAlign:'center',margin:"10px 0 "}} onClick={this.handleAddDesk}>
          <Icon type="plus" />
        </Card>
        {
          this.state.desks !== null ?
            this.state.desks.slice()
              .sort((a, b) => {
                if (a.name > b.name) {
                  return 1
                } else {
                  return -1
                }
              })
              .map((desk,idx) =>
              <DeskItem
                desk={desk}
                key={idx}
                onDelete={this.handleDeleteDesk}
                onEditDesk={this.handleEditDesk}
                showQRCode={this.showQRCode}
              />)
            :
            <div style={{ textAlign: "center" }}>
              <Spin />
            </div>
        }
        <DeskForm
          visible={this.state.visible}
          wrappedComponentRef={this.saveFormRef}
          onChange={this.onChange}
          onCancel={this.onCancel}
          desk={this.state.curEditDesk}
          confirmLoading={this.state.confirmLoading}
        />
        <Modal
          visible={this.state.QRCodeVisible}
          centered={true}
          onCancel={this.handleQRCodeCancel}
          footer={null}
          style={{textAlign:"center"}}
        >
          <QRCode value={`${window.location.origin}/#/customer/r/${this.state.QRCodeInfo.rid}/d/${this.state.QRCodeInfo.did}/landing`} />
          {`${window.location.origin}/#/customer/r/${this.state.QRCodeInfo.rid}/d/${this.state.QRCodeInfo.did}/landing`}
        </Modal>
      </div>
    )
  }
}

const DeskForm = Form.create({})(
  // eslint-disable-next-line
  class extends React.Component {



    render() {
      const { visible, onChange, onCancel, form, desk, confirmLoading} = this.props;
      const { getFieldDecorator } = form;
      let name = "";
      let capacity = 0;
      if (desk !== null) {
        name = desk.name
        capacity = desk.capacity
      }
      return (
        <Modal
          title={desk === null ? "新建桌面信息" : "更改桌面信息"}
          okText={desk === null ? "新建" : "更改"}
          visible={visible}
          cancelText="取消"
          onCancel={onCancel}
          confirmLoading={confirmLoading}
          onOk={() => onChange(desk)}
        >
          <Form layout="vertical">
            <Form.Item label="名称">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入桌面名称！' }],
                initialValue: name
              })(<Input />)}
            </Form.Item>
            <Form.Item label="容量">
              {getFieldDecorator('capacity', {
                initialValue: capacity
              })(<InputNumber min={0} />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);


function DeskItem({ desk, onDelete, onEditDesk, showQRCode }) {
  return (
    <Card
      title={`【${desk.name}】号桌`}
      style={{margin:"10px 0"}}
      extra={<Button onClick={() => onDelete(desk)}>删除</Button>}
      actions={[
        <Icon type="edit" key="edit" onClick={() => onEditDesk(desk)} />,
        <Icon type="qrcode" onClick={() => showQRCode(desk)} />
      ]}>
      <p>
        容量：{desk.capacity} 人
      </p>
    </Card>
  )
}



export default Desk;