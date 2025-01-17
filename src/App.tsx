import './App.scss';
import './locales/i18n';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import Heatmap from './components/HeatMap'
import { useTheme } from './hooks';


export default function App() {
  useTheme();
  return <Heatmap />
}