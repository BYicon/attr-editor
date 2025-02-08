# 商品属性编辑器 (AttrEditor)

基于原生 TypeScript 的商品属性编辑器组件，用于商品 SKU 属性的管理和编辑。

## 功能特点

- 支持动态添加/删除销售属性（如颜色、尺码等）
- 支持为每个属性添加/删除属性值
- 支持属性值的选择/取消选择
- 自动生成 SKU 组合表格
- 支持表格列的自定义配置
- 支持必填项校验
- 支持默认值设置
- 支持数据初始化
- 限制最大属性数量（默认 3 个）

## 使用示例

```typescript
import AttrEditor from 'attr-editor';

const attrEditor = new AttrEditor({
  container: document.getElementById('attr-container'),
  limit: 3,
  onChange: (result) => {
    console.log('result 🚀🚀🚀', result);
  },
  columns: [
    {
    key: 'stock',
    title: '库存',
    type: 'number',
    required: true,
    min: 0,
    step: 1,
    defaultValue: '0',
    placeholder: '请输入库存'
    },
  ],
  initialData: {
    attributes: [
        {
        id: '1',
        name: '颜色',
        values: [
                { id: '11', value: '红色', selected: true },
                { id: '12', value: '蓝色', selected: true }
            ]
        }
    ]
    }
});

```
