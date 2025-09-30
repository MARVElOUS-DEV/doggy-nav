import React, { useEffect } from 'react';
import { Drawer, Form, Input, Button, Switch, Space, message, Typography } from 'antd';
import { useRequest } from '@umijs/max';
import { ApiOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface AddOrEditProps {
  id?: string;
  setDrawerVisible: (visible: boolean) => void;
  actionRef: any;
}

const AddOrEdit: React.FC<AddOrEditProps> = ({ id, setDrawerVisible, actionRef }) => {
  const [form] = Form.useForm();
  const isEdit = !!id;

  // Get application details for editing
  const { loading: detailLoading, run: getDetail } = useRequest(
    () => ({
      method: 'GET',
      url: `/api/application/${id}`,
    }),
    {
      manual: true,
      onSuccess: (result) => {
        form.setFieldsValue({
          name: result.name,
          description: result.description,
          isActive: result.isActive,
          allowedOrigins: result.allowedOrigins || [],
        });
      }
    }
  );

  // Save application
  const { loading: saveLoading, run: saveApplication } = useRequest(
    (data) => ({
      method: isEdit ? 'PUT' : 'POST',
      url: isEdit ? `/api/application/${id}` : '/api/application',
      data,
    }),
    {
      manual: true,
      onSuccess: () => {
        message.success(isEdit ? '应用更新成功' : '应用创建成功');
        setDrawerVisible(false);
        actionRef?.current?.reload?.();
      },
      onError: (error) => {
        message.error(error.message || '操作失败');
      }
    }
  );

  useEffect(() => {
    if (isEdit && id) {
      getDetail();
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      saveApplication(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setDrawerVisible(false);
  };

  return (
    <Drawer
      title={
        <Space>
          <ApiOutlined />
          {isEdit ? '编辑应用' : '注册新应用'}
        </Space>
      }
      width={600}
      open={true}
      onClose={handleClose}
      loading={detailLoading}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>
              取消
            </Button>
            <Button
              type="primary"
              loading={saveLoading}
              onClick={handleSubmit}
            >
              {isEdit ? '更新' : '创建'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isActive: true,
          allowedOrigins: [],
        }}
      >
        <Form.Item
          label="应用名称"
          name="name"
          rules={[
            { required: true, message: '请输入应用名称' },
            { min: 2, message: '应用名称至少2个字符' },
            { max: 100, message: '应用名称最多100个字符' }
          ]}
        >
          <Input
            placeholder="请输入应用名称"
            prefix={<ApiOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="应用描述"
          name="description"
          rules={[
            { max: 500, message: '描述最多500个字符' }
          ]}
        >
          <TextArea
            placeholder="请输入应用描述（可选）"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="允许的来源域名"
          tooltip="配置允许访问此应用的域名，用于CORS控制（可选）"
        >
          <Form.List name="allowedOrigins">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name]}
                      rules={[
                        { type: 'url', message: '请输入有效的URL' },
                      ]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加允许域名
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {isEdit && (
          <Form.Item
            label="应用状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>
        )}

        {!isEdit && (
          <div style={{
            background: '#f6f8fa',
            border: '1px solid #d1d9e0',
            borderRadius: 8,
            padding: 16,
            marginTop: 16
          }}>
            <Text type="secondary">
              <strong>注意：</strong> 创建应用后将自动生成 Client Secret，请妥善保管。
              Client Secret 用于验证 API 请求的来源，确保应用安全。
            </Text>
          </div>
        )}
      </Form>
    </Drawer>
  );
};

export default AddOrEdit;