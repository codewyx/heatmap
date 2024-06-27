import './style.scss';
import React from 'react';
import { bitable, dashboard, DashboardState, FieldType, IConfig } from "@lark-base-open/js-sdk";
import { Button } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef } from 'react';
import { useConfig } from '../../hooks';
import classnames from 'classnames'
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next/typescript/t';
interface Iheat_mapConfig {
  type: 'grid' | 'row',
  table: string | null,
  view: string | null,
  titleRow: string | null,
  iconRow: string | null,
  linkRow: string | null
}



export default function heat_map() {

  const { t, i18n } = useTranslation();

  // create时的默认配置
  const [config, setConfig] = useState<Iheat_mapConfig>({
    type: 'grid',
    table: null,
    view: null,
    titleRow: null,
    iconRow: null,
    linkRow: null
  })


  const isCreate = dashboard.state === DashboardState.Create

  useEffect(() => {
    if (isCreate) {
      setConfig({
        type: 'grid',
        table: null,
        view: null,
        titleRow: null,
        iconRow: null,
        linkRow: null
      })
    }
  }, [i18n.language, isCreate])

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
    }
    else {
      setIsLight(true)
    }
    bitable.bridge.onThemeChange((e) => {
      setIsLight(e.data.theme.toLocaleLowerCase() != 'dark')
    })
  }, [document.body.getAttribute('theme-mode')])

  return (
    <main className={classnames({
      'main-config': isConfig,
      'main': true,
    })}>
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
    } as any)
  }

  return (
    <div className='config-panel'>
    </div>
  )
}