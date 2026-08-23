import type { DataTable } from '../types/problem'

interface DataTableViewProps {
  table: DataTable
  compact?: boolean
}

export function DataTableView({ table, compact = false }: DataTableViewProps) {
  return (
    <div className={`data-table-shell ${compact ? 'compact' : ''}`}>
      <div className="data-table-title">
        <span className="table-dot" />
        <span>{table.name}</span>
        <span className="row-count">{table.rows.length} rows</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {table.columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.name}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className={cell === null ? 'null-cell' : ''}>
                    {cell === null ? 'NULL' : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
