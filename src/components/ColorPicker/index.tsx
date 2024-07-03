//待完善的颜色选取组件（感谢tongyi大力支持）
import './style.scss';
import React, { useState, useEffect } from 'react';
import {Notification, Button, Input } from '@douyinfe/semi-ui'; 
import { useTranslation } from 'react-i18next';

interface ColorPickerProps {
    onChange: (colors: string[]) => void; 
    defaultColors?: string[]; 
}

export function ColorPicker(props: ColorPickerProps) {
    const { t } = useTranslation();
    
    // 使用defaultColors初始化颜色状态
    const [selectedColors, setSelectedColors] = useState<string[]>(props.defaultColors || ['#000000']);

    // 当defaultColors变化时，更新selectedColors
    useEffect(() => {
        setSelectedColors(props.defaultColors || ['#000000']);
    }, [props.defaultColors]);

    const [currentColor, setCurrentColor] = useState<string>(selectedColors[0] || '#000000');

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentColor(event.target.value);
    };

    const addSelectedColor = () => {
        if (currentColor && !selectedColors.includes(currentColor)) {
            setSelectedColors(selectedColors => [...selectedColors, currentColor]);
            // 状态更新逻辑移到这里，确保在setState之后执行
            props.onChange([...selectedColors, currentColor]);
        } else {
            let opts = {
                title:t('label.display.color.error.title'),
                content: t('label.display.color.error.content'),
                duration:3,
            };
            Notification.error(opts)
        }
    };
    
    const removeSelectedColor = (colorToRemove: string) => {
        setSelectedColors(selectedColors => 
            selectedColors.filter(color => color !== colorToRemove)
        );
        // 确保onChange在setState完成后再调用，并且使用最新的颜色数组
        props.onChange(selectedColors.filter(color => color !== colorToRemove));
    };
    return (
        <div>
            <div className="color-picker-container">
                <input
                    className="color-picker-input semi-input-wrapper "
                    type="color"
                    value={currentColor}
                    onChange={handleColorChange}
                />
                <Button onClick={addSelectedColor}>{t('label.display.select.add')}</Button>
            </div>

            <div>
                {selectedColors.map((color, index) => (
                    <div
                        key={index}
                        className="selected-color"
                        style={{ backgroundColor: color }}
                        onClick={() => removeSelectedColor(color)}
                    ></div>
                ))}
            </div>
        </div>
    );
}