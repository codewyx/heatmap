import './style.scss';
import React from 'react';
import { bitable, dashboard, DashboardState, FieldType, IConfig, SourceType, GroupMode } from "@lark-base-open/js-sdk";
import { Button } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef } from 'react';
import { useConfig } from '../../hooks';
import classnames from 'classnames'
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next/typescript/t';
import { allThemeMap } from '@visactor/vchart-theme';
import { darkTheme, default as VChart } from '@visactor/vchart';
import { TableSelector } from '../TableSelector'
import { ViewSelector } from '../ViewSelector';
import { Item } from '../Item';
import { ColorPicker } from '../ColorPicker'
import { CategorySelector } from '../CategorySelector';

//加载暗黑主题
allThemeMap.forEach((theme, name) => {
  VChart.ThemeManager.registerTheme("dark", darkTheme);
});

interface Iheat_mapConfig {
  tableId: string; // 数据源表
  dataRange: string;
  fieldIdX: string;
  fieldIdY: string;
  fieldIdData: string;
  color: string[];
  series?: 'COUNTA'; // 系列，指的是字段的计算方式
}


export default function heat_map() {

  const { t, i18n } = useTranslation();

  // create时的默认配置
  const [config, setConfig] = useState<Iheat_mapConfig>({
    tableId: "", // 数据源表
    fieldIdX: "",
    fieldIdY: "",
    fieldIdData: "",
    color: [],
    dataRange: ""
  })


  const isCreate = dashboard.state === DashboardState.Create

  useEffect(() => {
    if (isCreate) {
      setConfig({
        tableId: "", // 数据源表
        fieldIdX: "",
        fieldIdY: "",
        fieldIdData: "",
        color: [],
        dataRange: ""
      })
    }
  }, [i18n.language, isCreate])

  //-------------------------以下内容大多继承自url-group----------------------------
  /** 是否配置/创建模式下 */
  const isConfig = dashboard.state === DashboardState.Config || isCreate;

  const timer = useRef<any>()

  /** 配置用户配置 */
  const updateConfig = (res: IConfig) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    const { customConfig } = res;
    if (customConfig) {
      setConfig(customConfig as any);
      timer.current = setTimeout(() => {
        //自动化发送截图。 预留3s给浏览器进行渲染，3s后告知服务端可以进行截图了（对域名进行了拦截，此功能仅上架部署后可用）。
        dashboard.setRendered();
      }, 3000);
    }

  }

  useConfig(updateConfig)

  let [light, setIsLight] = useState(document.body.getAttribute('theme-mode') != 'dark')
  useEffect(() => {
    let theme = document.body.getAttribute('theme-mode')
    if (theme == 'dark') {
      setIsLight(false)
      //黑夜适配
      VChart.ThemeManager.setCurrentTheme('dark');
    }
    else {
      setIsLight(true)
    }
    bitable.bridge.onThemeChange((e) => {
      setIsLight(e.data.theme.toLocaleLowerCase() != 'dark')
    })
  }, [document.body.getAttribute('theme-mode')])
  // ----------------------------------------------------------------------------------

  // 初始化rawData数组
  const rawData: any[] = [];
  //获取数据函数
  async function fetchData() {
    //找表、找记录、对着记录一个一个获取字段加到数组里面去
    const table = await bitable.base.getTable(config.tableId);
    const recordList = await table.getRecordList();
    for (const record of recordList) {
      const Xcell = await record.getCellByField(config.fieldIdX);
      const Ycell = await record.getCellByField(config.fieldIdY);
      const DataCell = await record.getCellByField(config.fieldIdData);
      rawData.push({
        "var1": (await Xcell.getValue())[0]["text"],
        "var2": (await Ycell.getValue())[0]["text"],
        "value": await DataCell.getValue()
      });

    }
    initChart()
  }
  //预获取数据
  fetchData()



  var color
  //奇怪的暗黑模式适配(不过启用暗黑模式和大屏，会有奇怪的效果)
  let theme = document.body.getAttribute('theme-mode')
  if (theme == 'dark') {
    color = "#1A1A1A"
  }
  //奇怪的配置
  const spec = {
    background: color,
    type: 'common',
    padding: 12,
    data: [
      {
        id: 'data0',
        values: rawData
      }
    ],
    series: [
      {
        type: 'heatmap',
        regionId: 'region0',
        xField: 'var1',
        yField: 'var2',
        valueField: 'value',
        cell: {
          style: {
            fill: {
              field: 'value',
              scale: 'color'
            }
          }
        }
      }
    ],
    region: [
      {
        id: 'region0',
        width: 0,
        height: 0,

      }
    ],
    color: {
      type: 'linear',
      domain: [
        {
          dataId: 'data0',
          fields: ['value']
        }
      ],
      range: config.color
    },
    axes: [
      {
        orient: 'bottom',
        type: 'band',
        grid: {
          visible: false
        },
        domainLine: {
          visible: false
        },
        label: {
          space: 10,
          style: {
            textAlign: 'left',
            textBaseline: 'middle',
            angle: 90,
            fontSize: 8
          }
        },
        bandPadding: 0,
        height: (layoutRect: { height: number; }) => {
          // canvas height - region height - paddingTop - paddingBottom
          return layoutRect.height - 200 - 73;
        }
      },
      {
        orient: 'left',
        type: 'band',
        grid: {
          visible: false
        },
        domainLine: {
          visible: false
        },
        label: {
          space: 10,
          style: {
            fontSize: 8
          }
        },
        bandPadding: 0,
        width: (layoutRect: { width: number; }) => {

        }
      }
    ]
  };

  let vchart: any;



  //渲染函数
  function initChart() {
    const height = Math.max(document.documentElement.clientHeight, window.innerHeight)
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth)
    const mainElement = document.getElementById("main");
    if (mainElement) {
      mainElement.innerHTML = "";
    }
    if (isConfig) {
      /*
      奇怪的大小配置（经验积累，谨慎修改）
      分别为：背景颜色/宽度/高度/下面的字的大小/左边的字的大小/字的位移
      */
      if (theme == 'dark') {
        spec["background"] = "#292929"
      }
      spec["region"][0]["width"] = 500
      spec["region"][0]["height"] = 500
      spec["axes"][0]["label"]["style"]["fontSize"] = 14
      spec["axes"][1]["label"]["style"]["fontSize"] = 14

      spec["axes"][0]["height"] = () => {
        return height - (height - 40) / 1.3 - 75;
      }
      spec["axes"][1]["width"] = layoutRect => {
        return layoutRect.width = 220 - 73;
      }

    }
    else {

      /*
      奇怪的大小配置（经验积累，谨慎修改）
      分别为：宽度/高度/下面的字的大小/左边的字的大小/字的位移
      */
      spec["region"][0]["width"] = (width - 40) / 1.3;
      spec["region"][0]["height"] = (height - 40) / 1.3;
      spec["axes"][0]["label"]["style"]["fontSize"] = ((width - 40) / 28) >= 8 ? (width - 40) / 28 : 8
      spec["axes"][1]["label"]["style"]["fontSize"] = ((height - 40) / 28) >= 8 ? (height - 40) / 28 : 8
      spec["axes"][0]["height"] = () => {
        return height - (height - 40) / 1.3 - 24;
      }

    }
    //渲染到dom(下面的警告可以无视，想改也可以)
    vchart = new VChart(spec, { dom: "main" });
    vchart.renderSync();

    //配置页面位置修改
    if (mainElement && !isConfig) {
      const leftPosition = ((width - spec["region"][0]["width"]) / 4).toString() + "px";
      mainElement.style.left = leftPosition;
      const topPosition = ((height - spec["region"][0]["height"]) / 4).toString() + "px";
      mainElement.style.top = topPosition;
    }
  };



  //数据更改载一个
  dashboard.onDataChange(() => {
    initChart()
  })
  //大小更改载一个
  window.onresize = function () {
    initChart()
  };
  //页面出现载一个
  useEffect(() => {
    const update = dashboard.onConfigChange(() => {
      fetchData()
    });
    return () => {
      update();
    }
  }, []);
  //分类讨论输出内容
  return (
    <main className={classnames({
      'main-config': isConfig,
      'main': true
    })} >

      {
        !isConfig && <div id="main" className={classnames({ 'show': true })} ></div>
      }
      {
        isConfig && <div className={classnames({
          'main': true
        })} ><div className={classnames({ 'left': true })} id="main"></div><ConfigPanel t={t} config={config} setConfig={setConfig} /></div>
      }
    </main>

  )







}



function ConfigPanel(props: {
  config: Iheat_mapConfig,
  setConfig: React.Dispatch<React.SetStateAction<Iheat_mapConfig>>,
  t: TFunction<"translation", undefined>,
}) {
  const { config, setConfig, t } = props;

  /**保存配置 */
  const onSaveConfig = () => {
    dashboard.saveConfig({
      customConfig: config,
      dataConditions: [],
    } as any);
  }

  return (
    <div className='config-panel'>
      <div className='form'>
        <Item label={
          <div className='select-table'>
            {t('label.display.select.table')}
          </div>
        }>
          <TableSelector
            onChange={(e) => {
              setConfig({
                ...config,
                tableId: e
              })
            }}
            defaultSection={config.tableId}
          />
        </Item>
        <Item label={
          <div className='select-view'>
            {t('label.display.select.view')}
          </div>
        }>
          <ViewSelector
            onChange={(e) => {
              setConfig({
                ...config,
                dataRange: e
              })
            }}
            defaultSection={config.dataRange}
            tableId={config.tableId}
          />
        </Item>
        <Item label={
          <div className='select-table'>
            {t('label.display.select.x')}
          </div>
        }>
          <CategorySelector
            onChange={(e) => {
              setConfig({
                ...config,
                fieldIdX: e
              })
            }}
            defaultSection={config.fieldIdX}
            tableId={config.tableId}
            viewId={config.dataRange}
            availableFieldTypes={[FieldType.Text]}
          />

        </Item>
        <Item label={
          <div className='select-table'>
            {t('label.display.select.y')}
          </div>
        }>
          <CategorySelector
            onChange={(e) => {
              setConfig({
                ...config,
                fieldIdY: e
              })
            }}
            defaultSection={config.fieldIdY}
            tableId={config.tableId}
            viewId={config.dataRange}
            availableFieldTypes={[FieldType.Text]}
          />

        </Item>
        <Item label={
          <div className='select-table'>
            {t('label.display.select.data')}
          </div>
        }>
          <CategorySelector
            onChange={(e) => {
              setConfig({
                ...config,
                fieldIdData: e
              })
            }}
            defaultSection={config.fieldIdData}
            tableId={config.tableId}
            viewId={config.dataRange}
            availableFieldTypes={[FieldType.Number]}
          />

        </Item>
        <Item label={
          <div className='select-table'>
            {t('label.display.select.color')}
          </div>
        }>
          <ColorPicker onChange={(e) => {
            setConfig({
              ...config,
              color: e
            })
          }}

            defaultColors={config.color}></ColorPicker>

        </Item>
        <Button
          className='btn'
          theme='solid'
          onClick={() => {
            onSaveConfig();

          }}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  )
}