import React from "react";
import { PageHeader, Spin, Card, Icon, Modal, Form, Input, InputNumber, Upload, Button, Radio } from "antd";
import Axios from "axios";
import produce from "immer";
import "./FoodManage.css";


class Food extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rid: -1,
      foods: null,
      visible: false,
      fileList: [],
      curEditFood: null,
      confirmLoading: false,
      deleteLoading: false
    }
    if (this.props.location.state === undefined) {
      this.props.history.push("/manager/manage");
    } else {
      this.state.rid = this.props.location.state.id;
    }
  }

  componentDidMount() {
    if (this.state.rid > -1) {
      Axios.get(`/api/restaurant/${this.state.rid}/food`).then(res => {
        this.setState(produce(this.state, draft => {
          draft.foods = res.data.reverse();
        }))
      })
    }
  }
  deleteFood = (food) => {
    Modal.confirm({
      content: `确认删除菜品【${food.name}】吗？`,
      okText: "确认",
      cancelText: "取消",
      centered: true,
      confirmLoading: this.state.deleteLoading,
      onOk: () => {
        return new Promise((resolve => {
          this.setState(produce(state => {
            state.deleteLoading = true;
          }))
          Axios.delete(`/api/restaurant/${this.state.rid}/food/${food.id}`).then(res => {
            if (res.data.code) {
              this.setState(produce(this.state, draft => {
                draft.foods = this.state.foods.filter(it => it.id !== food.id);
                draft.deleteLoading = false;
              }))
              resolve();
            }
          })
        }))
      }
    })
  }

  addFood = () => {
    this.setState(produce(this.state, draft => {
      draft.visible = true;
      draft.curEditFood = null;
    }))
  }
  handleCancel = () => {
    this.setState(produce(this.state, draft => {
      draft.visible = false;
      draft.fileList = [];
    }), () => {
      setTimeout(() => {
        this.setState(produce(state => {
          state.curEditFood = null;
        }))
      }, 100)
      const { form } = this.formRef.props;
      form.resetFields();
    })
  }

  handleOk = (type, food) => {
    const { form } = this.formRef.props;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      // console.log('Received values of form: ', values);
      this.setState(produce(state => {
        state.confirmLoading = true;
      }))

      let formData = new FormData();
      formData.append("category", values.category);
      formData.append("description", values.description);
      formData.append("name", values.name);
      formData.append("price", values.price);
      formData.append("status", values.status);
      if (values.image) {
        formData.append("image", values.image.file);
      }
      if (type === "create") {
        Axios.post(`/api/restaurant/${this.state.rid}/food`, formData).then(res => {
          if (res.data.code) {
            form.resetFields();
            this.setState(produce(this.state, draft => {
              draft.visible = false;
              draft.fileList = [];
              draft.foods.unshift(res.data.newFood);
              draft.confirmLoading = false;
            }))
          }
        })
      } else if (type === "update") {
        Axios.put(`/api/restaurant/${this.state.rid}/food/${food.id}`, formData).then(res => {
          if (res.data.code) {
            let idx = this.state.foods.findIndex(it => it.id === food.id);
            this.setState(produce(this.state, draft => {
              draft.confirmLoading = false;
              draft.visible = false;
              draft.fileList = [];
              draft.foods[idx] = res.data.updatedFood
            }), () => {
              setTimeout(() => {
                this.setState(produce(state => {
                  state.curEditFood = null;
                }))
              }, 100)
            })
          }
        })
      }
    });
  }
  saveFormRef = formRef => {
    this.formRef = formRef;
  };

  handleFile = (e) => {
    this.setState(produce(this.state, draft => {
      draft.fileList = [e.file];
    }))
  }
  editFood = (food) => {
    this.setState(produce(this.state, draft => {
      draft.curEditFood = food;
      draft.visible = true;
    }))
  }
  render() {
    return (
      <div id="FoodManage">
        <PageHeader
          style={{
            border: '1px solid rgb(235, 237, 240)',
          }}
          onBack={() => this.props.history.go(-1)}
          title="菜单管理"
        />
        <Card className="plusIcon" onClick={this.addFood}>
          <Icon type={"plus"}></Icon>
        </Card>
        {
          this.state.foods !== null ?
            this.state.foods.map(food =>
              <FoodItem
                food={food}
                key={food.id}
                editFood={this.editFood}
                deleteFood={this.deleteFood}
              />)
            :
            <div style={{ textAlign: "center" }}>
              <Spin />
            </div>
        }
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.visible}
          onCancel={this.handleCancel}
          onOk={this.handleOk}
          fileList={this.state.fileList}
          newFile={this.handleFile}
          initialData={this.state.curEditFood}
          confirmLoading={this.state.confirmLoading}
        />
      </div>

    )
  }
}

const CollectionCreateForm = Form.create({})(
  class extends React.Component {
    render() {
      const { visible, onCancel, onOk, form, fileList, newFile, initialData, confirmLoading } = this.props;
      const { getFieldDecorator } = form;
      let name = "";
      let description = "";
      let category = "";
      let price = "";
      let status = "on";
      if (initialData !== null) {
        name = initialData.name;
        description = initialData.description;
        category = initialData.category;
        price = initialData.price;
        status = initialData.status;
      }
      return (
        <Modal
          confirmLoading={confirmLoading}
          visible={visible}
          title={initialData === null ? "创建新的菜品" : "更改菜品信息"}
          okText={initialData === null ? "创建" : "确认更改"}
          cancelText="取消"
          onCancel={onCancel}
          onOk={() => onOk(initialData === null ? "create" : "update", initialData)}
          centered={true}
        >
          <Form layout="vertical">
            <Form.Item label="名称">
              {getFieldDecorator('name', {
                initialValue: name,
                rules: [{ required: true, message: '请输入食物名字！' }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="描述">
              {getFieldDecorator('description', {
                initialValue: description
              })(<Input type="textarea" />)}
            </Form.Item>
            <Form.Item label="分类">
              {getFieldDecorator('category', {
                initialValue: category
              })(<Input type="textarea" />)}
            </Form.Item>
            <Form.Item label="价格（元）">
              {getFieldDecorator('price', {
                rules: [{ required: true, message: '请输入价格' }],
                initialValue: price
              })(<InputNumber min={0} />)}
            </Form.Item>
            <Form.Item label="状态">
              {getFieldDecorator('status', {
                initialValue: status
              })(
                <Radio.Group>
                  <Radio value={"on"}>上线</Radio>
                  <Radio value={"off"}>下线</Radio>
                </Radio.Group>
              )}
            </Form.Item>
            <Form.Item label={initialData === null ? "选择菜品图片" : "更改当前图片"}>
              {getFieldDecorator('image', {
                valuePropName: 'image',
              })(
                <Upload beforeUpload={(file) => {
                  return false;
                }}
                  fileList={fileList}
                  onChange={(event) => {
                    newFile(event);
                  }}
                >
                  <Button>
                    <Icon type="upload" /> 点击上传
                  </Button>
                </Upload>,
              )}
            </Form.Item>

          </Form>
        </Modal>
      );
    }
  },
);


function FoodItem({ food, editFood, deleteFood }) {
  return (
    <Card
      className="foodItem"
      cover={
        <div style={{
          backgroundImage: `url("/uploads/${food.image}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          width: "100%",
          // height: "300px",
          padding: "50% 0"
        }}>
        </div>
      }
      hoverable={true}
      actions={[
        <Icon type="edit" key="edit" onClick={() => editFood(food)} />,
        <Icon type="delete" key="delete" onClick={() => deleteFood(food)} />,
      ]}
      size={"small"}
    >
      <Card.Meta
        title={<p className="foodName">{food.name}</p>}
        description={
          <div className="foodDetails">
            <p>价格：{food.price}元</p>
            <p>描述：{food.description || "暂无"}</p>
            <p>分类：{food.category || "暂无"}</p>
            <p>状态：{food.status === "on" ? "上线" : "下线"}</p>
          </div>
        }
      />
    </Card>
  )
}

export default Food;