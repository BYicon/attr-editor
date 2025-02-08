interface AttributeValue {
  id: string;
  value: string;
  selected?: boolean;
}

interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

interface AttrEditorResult {
  attributes: Attribute[];
  combinations: CombinationItem[];
}

interface AttrEditorOptions {
  container: HTMLElement | string;
  limit?: number;
  onChange?: (result: AttrEditorResult) => void;
  columns?: TableColumn[];
  initialData?: {
    attributes?: Attribute[];
    combinations?: CombinationItem[];
  };
}

interface CombinationItem {
  id: string;
  attributes: string[];
  [key: string]: string | string[];
}

// 添加校验相关的接口
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
}

// 添加列配置相关的接口
interface TableColumn {
  key: string;
  title: string;
  type: 'input' | 'select' | 'number';
  required?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number;
}

interface SelectOption {
  label: string;
  value: string | number;
}

class AttrEditor {
  private container: HTMLElement;
  private attributes: Attribute[] = [];
  private combinations: CombinationItem[] = [];
  private onChange?: (result: AttrEditorResult) => void;
  private showValidation: boolean = false;
  private columns: TableColumn[] = [];
  private limit: number = 3; // 默认限制3个属性

  constructor(options: AttrEditorOptions) {
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container) as HTMLElement
      : options.container;
    this.onChange = options.onChange;
    this.columns = options.columns || [];
    this.limit = options.limit || 3; // 使用传入的limit或默认值

    // 初始化数据
    if (options.initialData) {
      this.attributes = options.initialData.attributes || [];
      this.combinations = options.initialData.combinations || [];
    }

    this.init();
  }

  private init(): void {
    this.container.className = 'anty-attr-editor';
    this.render();
    this.bindEvents();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private render(): void {
    const template = `
      <div class="anty-attr-list">
        ${this.attributes.map((attr, index) => this.renderAttribute(attr, index)).join('')}
      </div>
      <div class="anty-attr-add">
        <button class="anty-btn anty-btn-primary" id="anty-add-attr" 
          ${this.attributes.length >= this.limit ? 'disabled' : ''}>
          添加销售属性${this.attributes.length >= this.limit ? 
            `(已达到${this.limit}个上限)` : 
            ''}
        </button>
      </div>
      ${this.renderCombinationTable()}
    `;
    this.container.innerHTML = template;
  }

  private renderAttribute(attr: Attribute, index: number): string {
    return `
      <div class="anty-attr-item" data-id="${attr.id}">
        <div class="anty-attr-header">
          <label class="anty-attr-label">商品属性${index + 1}：</label>
          <div class="anty-form-item">
            <input 
              type="text" 
              class="anty-input" 
              value="${attr.name}"
              placeholder="请输入属性名称"
            />
          </div>
          <button class="anty-btn anty-btn-text anty-btn-delete">移除属性</button>
        </div>
        <div class="anty-attr-values">
          <div class="anty-value-tags">
            ${attr.values.map(value => this.renderValueTag(value)).join('')}
          </div>
          <div class="anty-value-input-wrapper">
            <input 
              type="text" 
              class="anty-input anty-value-input" 
              placeholder="请输入属性值"
              ${!attr.name ? 'disabled' : ''}
            />
            <button class="anty-btn anty-btn-primary anty-add-value" ${!attr.name ? 'disabled' : ''}>
              添加属性值
            </button>
          </div>
          ${!attr.name ? '<div class="anty-form-error-msg">请先输入属性名称</div>' : ''}
        </div>
      </div>
    `;
  }

  private renderValueTag(value: AttributeValue): string {
    return `
      <span class="anty-tag ${value.selected ? 'anty-tag-selected' : ''}" data-id="${value.id}">
        ${value.value}
        <span class="anty-tag-close" data-id="${value.id}">&times;</span>
      </span>
    `;
  }

  private renderCombinationTable(): string {
    if (this.attributes.length === 0) return '';

    const validAttrs = this.attributes.filter(attr => 
      attr.values.some(v => v.selected)
    );
    if (validAttrs.length === 0) return '';

    const attrCombinations = this.generateCombinations(validAttrs);
    this.updateCombinations(attrCombinations);

    return `
      <div class="anty-combination-table-wrapper">
        <table class="anty-table">
          <thead class="anty-table-thead">
            <tr>
              ${validAttrs.map(attr => 
                `<th class="anty-table-cell">${attr.name || '未命名属性'}</th>`
              ).join('')}
              ${this.columns.map(column => 
                `<th class="anty-table-cell">
                  ${column.title}${column.required ? '<span class="anty-required">*</span>' : ''}
                </th>`
              ).join('')}
            </tr>
          </thead>
          <tbody class="anty-table-tbody">
            ${this.combinations.map(item => `
              <tr data-id="${item.id}">
                ${item.attributes.map(value => 
                  `<td class="anty-table-cell">${value}</td>`
                ).join('')}
                ${this.columns.map(column => 
                  this.renderTableCell(column, item)
                ).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderTableCell(column: TableColumn, item: CombinationItem): string {
    const value = (item[column.key] as string) || '';
    const showError = this.showValidation && column.required && !value;

    let input = '';
    switch (column.type) {
      case 'select':
        input = `
          <select 
            class="anty-select ${showError ? 'anty-select-error' : ''}"
            data-key="${column.key}"
          >
            <option value="">${column.placeholder || '请选择'}</option>
            ${column.options?.map(opt => 
              `<option value="${opt.value}" ${String(opt.value) === String(value) ? 'selected' : ''}>
                ${opt.label}
              </option>`
            ).join('')}
          </select>
        `;
        break;
      case 'number':
        input = `
          <input 
            type="number"
            class="anty-input ${showError ? 'anty-input-error' : ''}"
            value="${value}"
            data-key="${column.key}"
            min="${column.min || 0}"
            step="${column.step || 1}"
            placeholder="${column.placeholder || ''}"
          />
        `;
        break;
      default:
        input = `
          <input 
            type="text"
            class="anty-input ${showError ? 'anty-input-error' : ''}"
            value="${value}"
            data-key="${column.key}"
            placeholder="${column.placeholder || ''}"
          />
        `;
    }

    return `
      <td class="anty-table-cell">
        <div class="anty-form-item ${showError ? 'anty-form-item-error' : ''}">
          ${input}
          ${showError ? 
            `<div class="anty-form-error-msg">请输入${column.title}</div>` : 
            ''}
        </div>
      </td>
    `;
  }

  private updateCombinations(attrCombinations: string[][]): void {
    const existingCombinations = new Map(
      this.combinations.map(item => [item.attributes.join('|'), item])
    );

    this.combinations = attrCombinations.map(combination => {
      const key = combination.join('|');
      const existing = existingCombinations.get(key);
      
      if (existing) {
        return existing;
      }

      const newItem: CombinationItem = {
        id: this.generateId(),
        attributes: combination
      };

      this.columns.forEach(column => {
        if (column.type === 'select' && column.options && column.options.length > 0) {
          newItem[column.key] = column.defaultValue !== undefined ? 
            String(column.defaultValue) : 
            String(column.options[0].value);
        } else {
          newItem[column.key] = column.defaultValue !== undefined ? 
            String(column.defaultValue) : 
            '';
        }
      });

      return newItem;
    });
  }

  private generateCombinations(attributes: Attribute[]): string[][] {
    if (attributes.length === 0) return [];
    
    if (attributes.length === 1) {
      return attributes[0].values
        .filter(v => v.selected)
        .map(v => [v.value]);
    }
    
    const firstAttr = attributes[0];
    const restCombinations = this.generateCombinations(attributes.slice(1));
    
    const result: string[][] = [];
    firstAttr.values
      .filter(v => v.selected)
      .forEach(value => {
        if (restCombinations.length === 0) {
          result.push([value.value]);
        } else {
          restCombinations.forEach(combination => {
            result.push([value.value, ...combination]);
          });
        }
      });
    
    return result;
  }

  private bindEvents(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'anty-add-attr') {
        this.addAttribute();
      }
      
      if (target.classList.contains('anty-add-value')) {
        const attrItem = target.closest('.anty-attr-item');
        if (attrItem) {
          const input = attrItem.querySelector('.anty-value-input') as HTMLInputElement;
          const value = input.value.trim();
          if (value) {
            this.addValue(attrItem.getAttribute('data-id') as string, value);
            input.value = '';
          }
        }
      }

      if (target.classList.contains('anty-tag-close')) {
        const valueId = target.getAttribute('data-id');
        const attrItem = target.closest('.anty-attr-item');
        if (attrItem && valueId) {
          this.deleteValueById(attrItem.getAttribute('data-id') as string, valueId);
        }
      }

      if (target.classList.contains('anty-btn-delete')) {
        const attrItem = target.closest('.anty-attr-item');
        if (attrItem) {
          this.deleteAttribute(attrItem as HTMLElement);
        }
      }

      if (target.classList.contains('anty-tag') && !target.classList.contains('anty-tag-close')) {
        const valueId = target.getAttribute('data-id');
        const attrItem = target.closest('.anty-attr-item');
        if (attrItem && valueId) {
          this.toggleValueSelection(attrItem.getAttribute('data-id') as string, valueId);
        }
      }
    });

    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      
      if (target.classList.contains('anty-input') && !target.classList.contains('anty-value-input')) {
        const attrItem = target.closest('.anty-attr-item');
        if (attrItem) {
          const attrId = attrItem.getAttribute('data-id');
          const attr = this.attributes.find(a => a.id === attrId);
          if (attr) {
            const oldName = attr.name;
            attr.name = target.value;

            // 更新属性值区域的状态
            const attrValuesDiv = attrItem.querySelector('.anty-attr-values');
            if (attrValuesDiv) {
              const valueInput = attrValuesDiv.querySelector('.anty-value-input') as HTMLInputElement;
              const addValueBtn = attrValuesDiv.querySelector('.anty-add-value') as HTMLButtonElement;
              const errorMsg = attrValuesDiv.querySelector('.anty-form-error-msg');

              if (valueInput) {
                valueInput.disabled = !attr.name;
              }
              if (addValueBtn) {
                addValueBtn.disabled = !attr.name;
              }
              if (errorMsg) {
                (errorMsg as HTMLElement).style.display = attr.name ? 'none' : 'block';
              }
            }

            // 更新表格（如果存在）
            const tableWrapper = this.container.querySelector('.anty-combination-table-wrapper');
            if (tableWrapper) {
              tableWrapper.outerHTML = this.renderCombinationTable();
            }

            if (oldName !== attr.name) {
              this.notifyChange();
            }
          }
        }
        return;
      }

      const key = target.getAttribute('data-key');
      if (key) {
        const row = target.closest('tr');
        if (row) {
          const combinationId = row.getAttribute('data-id');
          const combination = this.combinations.find(c => c.id === combinationId);
          if (combination) {
            const oldValue = combination[key];
            combination[key] = target.value;
            
            if (this.showValidation) {
              const formItem = target.closest('.anty-form-item');
              if (formItem) {
                const column = this.columns.find(col => col.key === key);
                const hasError = column?.required && !target.value.trim();
                
                formItem.classList.toggle('anty-form-item-error', hasError);
                target.classList.toggle('anty-input-error', hasError);
                
                let errorMsg = formItem.querySelector('.anty-form-error-msg');
                if (hasError && !errorMsg) {
                  errorMsg = document.createElement('div');
                  errorMsg.className = 'anty-form-error-msg';
                  errorMsg.textContent = `请输入${column?.title}`;
                  formItem.appendChild(errorMsg);
                } else if (!hasError && errorMsg) {
                  errorMsg.remove();
                }
              }
            }

            if (oldValue !== target.value) {
              this.notifyChange();
            }
          }
        }
      }
    });

    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const key = target.getAttribute('data-key');
      
      if (key) {
        const row = target.closest('tr');
        if (row) {
          const combinationId = row.getAttribute('data-id');
          const combination = this.combinations.find(c => c.id === combinationId);
          if (combination) {
            const oldValue = combination[key];
            combination[key] = target.value;
            
            if (this.showValidation) {
              const formItem = target.closest('.anty-form-item');
              if (formItem) {
                const column = this.columns.find(col => col.key === key);
                const hasError = column?.required && !target.value;
                
                formItem.classList.toggle('anty-form-item-error', hasError);
                target.classList.toggle('anty-select-error', hasError);
                
                let errorMsg = formItem.querySelector('.anty-form-error-msg');
                if (hasError && !errorMsg) {
                  errorMsg = document.createElement('div');
                  errorMsg.className = 'anty-form-error-msg';
                  errorMsg.textContent = `请输入${column?.title}`;
                  formItem.appendChild(errorMsg);
                } else if (!hasError && errorMsg) {
                  errorMsg.remove();
                }
              }
            }

            if (oldValue !== target.value) {
              this.notifyChange();
            }
          }
        }
      }
    });
  }

  private addAttribute(): void {
    if (this.attributes.length >= this.limit) {
      return;
    }

    const newAttr: Attribute = {
      id: this.generateId(),
      name: '',
      values: []
    };
    this.attributes.push(newAttr);
    this.render();
    this.notifyChange();
  }

  private addValue(attrId: string, value: string): void {
    const attr = this.attributes.find(a => a.id === attrId);
    if (attr && attr.name) { // 只有在属性名存在时才允许添加属性值
      if (!attr.values.some(v => v.value === value)) {
        attr.values.push({
          id: this.generateId(),
          value: value,
          selected: true
        });
        this.render();
        this.notifyChange();
      }
    }
  }

  private deleteAttribute(element: HTMLElement): void {
    const attrId = element.getAttribute('data-id');
    this.attributes = this.attributes.filter(attr => attr.id !== attrId);
    this.render();
    this.notifyChange();
  }

  private deleteValueById(attrId: string, valueId: string): void {
    const attr = this.attributes.find(a => a.id === attrId);
    if (attr) {
      attr.values = attr.values.filter(v => v.id !== valueId);
      this.render();
      this.notifyChange();
    }
  }

  private notifyChange(): void {
    if (this.onChange) {
      this.onChange({
        attributes: this.attributes,
        combinations: this.combinations
      });
    }
  }

  private toggleValueSelection(attrId: string, valueId: string): void {
    const attr = this.attributes.find(a => a.id === attrId);
    if (attr) {
      const value = attr.values.find(v => v.id === valueId);
      if (value) {
        value.selected = !value.selected;
        this.render();
        this.notifyChange();
      }
    }
  }

  public setAttributes(attributes: Attribute[]): void {
    this.attributes = attributes;
    this.render();
  }

  public getAttributes(): Attribute[] {
    return [...this.attributes];
  }

  public getCombinations(): CombinationItem[] {
    return [...this.combinations];
  }

  public setCombinations(combinations: CombinationItem[]): void {
    this.combinations = combinations;
    this.render();
  }

  public validate(): ValidationResult {
    const errors: ValidationError[] = [];
    
    this.combinations.forEach(combination => {
      this.columns.forEach(column => {
        if (column.required && !combination[column.key]) {
          errors.push({
            id: combination.id,
            field: column.key,
            message: `请输入${column.title}`
          });
        }
      });
    });

    const valid = errors.length === 0;
    
    this.showValidation = true;
    this.render();

    return { valid, errors };
  }

  public clearValidation(): void {
    this.showValidation = false;
    this.render();
  }

  public setDefaultValues(values: { [key: string]: string | number }): void {
    Object.entries(values).forEach(([key, value]) => {
      const column = this.columns.find(col => col.key === key);
      if (column) {
        column.defaultValue = value;
      }
    });

    this.combinations.forEach(combination => {
      Object.entries(values).forEach(([key, value]) => {
        if (!combination[key]) {
          combination[key] = String(value);
        }
      });
    });

    this.render();
  }

  public resetToDefault(): void {
    this.combinations.forEach(combination => {
      this.columns.forEach(column => {
        if (column.defaultValue !== undefined) {
          combination[column.key] = String(column.defaultValue);
        }
      });
    });
    this.render();
  }
}

export default AttrEditor;