import { EmptyState } from './EmptyState.js';

function resolveLabel(label) {
  return typeof label === 'function' ? label() : (label || '');
}

function actionsLabel() {
  return (window.StaffI18N && window.StaffI18N.t('staff.actions')) || 'Actions';
}

export class TableRender {
  constructor(config) {
    this.containerId = config.containerId;
    this.columns = config.columns;
    this.actions = config.actions || [];
    this.emptyMessage = config.emptyMessage || 'No records found.';
  }

  renderLoading(rowCount = 5) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    let rowsHtml = '';
    for (let i = 0; i < rowCount; i++) {
      rowsHtml += `
        <tr class="skeleton-row">
          ${this.columns.map(() => `<td><div class="skeleton-box"></div></td>`).join('')}
          ${this.actions.length > 0 ? `<td><div class="skeleton-box"></div></td>` : ''}
        </tr>
      `;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-custom">
          <thead>
            <tr>
              ${this.columns.map(col => `<th>${resolveLabel(col.label)}</th>`).join('')}
              ${this.actions.length > 0 ? `<th>${actionsLabel()}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  renderData(data, onActionClick) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (!data || data.length === 0) {
      const msg = typeof this.emptyMessage === 'function' ? this.emptyMessage() : this.emptyMessage;
      EmptyState.render(this.containerId, msg);
      return;
    }

    const theadHtml = `
      <thead>
        <tr>
          ${this.columns.map(col => `<th>${resolveLabel(col.label)}</th>`).join('')}
          ${this.actions.length > 0 ? `<th>${actionsLabel()}</th>` : ''}
        </tr>
      </thead>
    `;
    
    const tbody = document.createElement('tbody');
    
    data.forEach(item => {
      const tr = document.createElement('tr');
      
      this.columns.forEach(col => {
        const td = document.createElement('td');
        td.innerHTML = col.render ? col.render(item) : (item[col.key] || '');
        tr.appendChild(td);
      });
      
      if (this.actions.length > 0) {
        const actionTd = document.createElement('td');
        actionTd.className = 'table-actions';
        
        this.actions.forEach(action => {
          if (action.show && !action.show(item)) return;
          
          const btn = document.createElement('button');
          btn.className = `btn btn-sm ${action.class || 'btn-primary'} me-1 mb-1`;
          const lbl = resolveLabel(action.label);
          btn.innerHTML = action.icon ? `<i class="bi ${action.icon}"></i> ${lbl}` : lbl;
          btn.title = action.title || lbl || '';
          
          if (action.disabled && action.disabled(item)) {
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
          } else {
            btn.addEventListener('click', () => {
              if (onActionClick) onActionClick(action.id, item);
            });
          }
          
          actionTd.appendChild(btn);
        });
        
        tr.appendChild(actionTd);
      }
      
      tbody.appendChild(tr);
    });
    
    container.innerHTML = `<div class="table-responsive"><table class="table table-custom">${theadHtml}</table></div>`;
    container.querySelector('table').appendChild(tbody);
  }
}
