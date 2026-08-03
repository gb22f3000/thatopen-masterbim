import * as OBC from '@thatopen/components'
import * as BUI from '@thatopen/ui'
import * as FRAGS from '@thatopen/fragments'

type QtoResult = { [setName: string]: { [qtoName: string]: number } }

type TableGroupData = {
  data: { Set?: string; QTO?: string; Value?: number }
  children?: TableGroupData[]
}

const QUANTITY_KEYS = [
  /volume/i,
  /area/i,
  /length/i,
  /width/i,
  /height/i,
  /depth/i,
  /gross/i,
  /net/i,
  /weight/i,
  /perimeter/i,
]

function isQuantityName(name: string) {
  return QUANTITY_KEYS.some((pattern) => pattern.test(name))
}

function collectQuantities(
  item: FRAGS.ItemData,
  result: QtoResult,
  setName = 'Element Quantities'
) {
  for (const [key, value] of Object.entries(item)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object') {
          const childName =
            typeof (child as any).Name === 'object' &&
            (child as any).Name?.value
              ? String((child as any).Name.value)
              : key
          collectQuantities(child as FRAGS.ItemData, result, childName)
        }
      }
      continue
    }

    if (
      value &&
      typeof value === 'object' &&
      'value' in value &&
      typeof (value as any).value === 'number' &&
      isQuantityName(key)
    ) {
      if (!(setName in result)) result[setName] = {}
      if (!(key in result[setName])) result[setName][key] = 0
      result[setName][key] += (value as any).value as number
    }
  }
}

export class SimpleQTO extends OBC.Component implements OBC.Disposable {
  static uuid = '7ec21568-e809-4392-a810-50b16b3777c4'
  enabled = true
  onDisposed = new OBC.Event<any>()
  private _qtoResult: QtoResult = {}
  table: BUI.Table

  constructor(components: OBC.Components) {
    super(components)
    this.components.add(SimpleQTO.uuid, this)
  }

  resetQuantities() {
    this._qtoResult = {}
    this.updateTable()
  }

  async sumQuantities(modelIdMap: OBC.ModelIdMap) {
    this.resetQuantities()
    if (OBC.ModelIdMapUtils.isEmpty(modelIdMap)) {
      this.updateTable()
      return
    }

    const fragments = this.components.get(OBC.FragmentsManager)
    const dataByModel = await fragments.getData(modelIdMap, {
      attributesDefault: true,
      relations: {
        IsDefinedBy: { attributes: true, relations: true },
      },
    })

    for (const items of Object.values(dataByModel)) {
      for (const item of items) {
        collectQuantities(item, this._qtoResult)
      }
    }

    let count = 0
    let volume = 0
    for (const [modelId, ids] of Object.entries(modelIdMap)) {
      count += ids.size
      const model = fragments.list.get(modelId)
      if (!model) continue
      try {
        volume += await model.getItemsVolume([...ids])
      } catch {
        // Some items may not have mesh volume data
      }
    }

    this._qtoResult['Selection'] = {
      ...(this._qtoResult['Selection'] || {}),
      Count: count,
      ComputedVolume: volume,
    }

    this.updateTable()
  }

  private updateTable() {
    if (!this.table) return

    const tableData: TableGroupData[] = []
    for (const set of Object.keys(this._qtoResult)) {
      tableData.push({
        data: { Set: set },
        children: Object.keys(this._qtoResult[set]).map((qto) => ({
          data: { QTO: qto, Value: this._qtoResult[set][qto] },
        })),
      })
    }

    this.table.data = tableData
  }

  async dispose() {
    this.resetQuantities()
    this.onDisposed.trigger()
  }
}
