import aiProvidersData from './aiProviders.json';
import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
import { writeText as writeClipboard, readText as readClipboard} from "@tauri-apps/plugin-clipboard-manager";
import {
    Button, Alert, Chip,
    Dialog, DialogContent, DialogActions, DialogTitle, TextField,
    FormGroup, FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel, Slider, Typography, Box,
} from '@mui/material';
import { Settings } from './types'
import { getDefaultSettings } from './store'
import ThemeChangeButton from './theme/ThemeChangeIcon';
import { ThemeMode } from './theme/index';
import { useThemeSwicher } from './theme/ThemeSwitcher';
import { styled } from '@mui/material/styles';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { Trans, useTranslation } from 'react-i18next'
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle';
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle';

const languages: string[] = ['en', 'zh-Hans', 'zh-Hant','jp'];
const languageMap: { [key: string]: string } = {
    'en': 'English',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁體中文',
    'jp':'日本語'
};
interface Props {
    open: boolean
    settings: Settings
    close(): void
    save(settings: Settings): void
}

export default function SettingWindow(props: Props) {
    const [showPaste, setShowPaste] = useState(false);
    const [aiProviders, setAIProviders] = useState<any>(aiProvidersData);
    const [selectedAIProvider, setSelectedAIProvider] = useState(Object.keys(aiProviders)[0]); // 默认选择第一个AI提供商
    const [selectedModel, setSelectedModel] = useState(Object.keys(aiProviders[selectedAIProvider].models)[0]); // 默认选择第一个模型
    // 设置默认最小“最大上下文长度”
    const [minMaxContentLength, setMinMaxContentLength] = useState(128);
    // 设置默认最大“最大上下文长度”
    const [maxMaxContentLength, setMaxMaxContentLength] = useState(4096);
    // 设置默认最小“最大生成长度”
    const [minMaxGenerateLength, setMinMaxGenerateLength] = useState(128);
    // 设置默认最大“最大生成长度”
    const [maxMaxGenerateLength, setMaxMaxGenerateLength] = useState(4096);

    let timeoutId = useRef<any>(null);
    const { t } = useTranslation()
    const [settingsEdit, setSettingsEdit] = React.useState<Settings>(props.settings);
    const handleRepliesTokensSliderChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (newValue === 32728) {
            setSettingsEdit({ ...settingsEdit, maxTokens: 'inf' });
        } else {
            setSettingsEdit({ ...settingsEdit, maxTokens: newValue.toString() });
        }
    };
    const handleMaxContextSliderChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (newValue === 32728) {
            setSettingsEdit({ ...settingsEdit, maxContextSize: 'inf' });
        } else {
            setSettingsEdit({ ...settingsEdit, maxContextSize: newValue.toString() });
        }
    };
    const handleTemperatureChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (typeof newValue === 'number') {
            setSettingsEdit({ ...settingsEdit, temperature: newValue });
        } else {
            setSettingsEdit({ ...settingsEdit, temperature: newValue[activeThumb] });
        }
    };
    const handleRepliesTokensInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value === 'inf') {
            setSettingsEdit({ ...settingsEdit, maxTokens: 'inf' });
        } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue >= 0) {
                if (numValue > 32728) {
                    setSettingsEdit({ ...settingsEdit, maxTokens: 'inf' });
                    return;
                }
                setSettingsEdit({ ...settingsEdit, maxTokens: value });
            }
        }
    };
    const handleMaxContextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value === 'inf') {
            setSettingsEdit({ ...settingsEdit, maxContextSize: 'inf' });
        } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue >= 0) {
                if (numValue > 32728) {
                    setSettingsEdit({ ...settingsEdit, maxContextSize: 'inf' });
                    return;
                }
                setSettingsEdit({ ...settingsEdit, maxContextSize: value });
            }
        }
    };

    const [, { setMode }] = useThemeSwicher();
    useEffect(() => {
        setSettingsEdit(props.settings)
    }, [props.settings])

    const onCancel = () => {
        props.close()
        setSettingsEdit(props.settings)

        // need to restore the previous theme
        setMode(props.settings.theme ?? ThemeMode.System);
    }

    // preview theme
    const changeModeWithPreview = (newMode: ThemeMode) => {
        setSettingsEdit({ ...settingsEdit, theme: newMode });
        setMode(newMode);
    }

    async function getPasteContent() {
        let text = '';
        try {
            text = await readClipboard();
        } catch (error) {
            console.error(error);
            text = '';
        }
        return text;
    }

    const pasteAPIKey = async () => {
        const pasteContent = await getPasteContent();
        setSettingsEdit({ ...settingsEdit, openaiKey: pasteContent.trim() });
    }

    const clearAPIKey = async () => {
        setSettingsEdit({ ...settingsEdit, openaiKey: ""});
    }

    const handleInputChange = (event: any) => {
        setSettingsEdit({ ...settingsEdit, openaiKey: event.target.value.trim() })
        setShowPaste(true);
    }

    // listen aiProvider change event
    useEffect(() => {
        if (selectedAIProvider) {
          // Set URL with provider's default URL
          const newApiUrl = aiProviders[selectedAIProvider].url;
          // Set first model in provider with provider's default model
          const defaultModel = Object.keys(aiProviders[selectedAIProvider].models)[0];
          setSelectedModel(defaultModel);
          // Set temperature for default model
          const temperatureObject = aiProviders[selectedAIProvider].models[defaultModel].temperature;
          const defaultTemperature = temperatureObject.default;
          // Set ContentLength for default model
          const maxContentLengthObj = aiProviders[selectedAIProvider].models[defaultModel].maxContentLength;
          const defaultMaxContentLength = maxContentLengthObj.default;
          setMinMaxContentLength(maxContentLengthObj.min);
          setMaxMaxContentLength(maxContentLengthObj.max);
          // Set GeneraterLength for default model
          const maxGenerateLengthObj = aiProviders[selectedAIProvider].models[defaultModel].maxGenerateLength;
          const defaultMaxGenerateLength = maxGenerateLengthObj.default;
          setMinMaxGenerateLength(maxGenerateLengthObj.min);
          setMaxMaxGenerateLength(maxGenerateLengthObj.max);
          setSettingsEdit((prevSettings) => {
            return {
                ...prevSettings,
                apiUrl: newApiUrl,
                model: defaultModel,
                temperature: defaultTemperature,
                maxContextSize: defaultMaxContentLength,
                maxTokens: defaultMaxGenerateLength
            };
          });
        }
      }, [selectedAIProvider]);
    
    
    // listen aiProvider change event
    useEffect(() => {
        if (selectedModel) {
          // Set temperature for default model
          const temperatureObject = aiProviders[selectedAIProvider].models[selectedModel].temperature;
          const defaultTemperature = temperatureObject.default;
          // Set ContentLength for default model
          const maxContentLengthObj = aiProviders[selectedAIProvider].models[selectedModel].maxContentLength;
          const defaultMaxContentLength = maxContentLengthObj.default;
          setMinMaxContentLength(maxContentLengthObj.min);
          setMaxMaxContentLength(maxContentLengthObj.max);
          // Set GeneraterLength for default model
          const maxGenerateLengthObj = aiProviders[selectedAIProvider].models[selectedModel].maxGenerateLength;
          const defaultMaxGenerateLength = maxGenerateLengthObj.default;
          setMinMaxGenerateLength(maxGenerateLengthObj.min);
          setMaxMaxGenerateLength(maxGenerateLengthObj.max);
          setSettingsEdit((prevSettings) => {
            return {
                ...prevSettings,
                temperature: defaultTemperature,
                maxContextSize: defaultMaxContentLength,
                maxTokens: defaultMaxGenerateLength
            };
          });
        }
      }, [selectedModel]);

    const handleProviderInputChange = (event: any) => {
        // seting when provider change
        // set provider
        setSelectedAIProvider(event.target.value);
        setSettingsEdit({...settingsEdit, aiProvider: event.target.value});
    }

    const delay_clear_paste_on_blur = () => {
        // Clear the previous timeout if it exists
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        // Set a new timeout to hide the paste button
        timeoutId.current = setTimeout(() => {
          setShowPaste(false);
        }, 2000); // Hide after 1.5 seconds
    }

    const delay_clear_paste_on_focus = () => {
        // Clear the previous timeout if it exists
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        setShowPaste(true);
    }

    // @ts-ignore
    // @ts-ignore
    // const [isFocused, setIsFocused] = useState(false);
    return (
        <Dialog open={props.open} onClose={onCancel} fullWidth >
            <DialogTitle>{t('settings')}</DialogTitle>
            <DialogContent style={{ position: 'relative' }}>
            <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel htmlFor="ai-provider-select">AI Provider</InputLabel>
            <Select
              label="AI Provider"
              id="ai-provider-select"
              value={selectedAIProvider}
              // onChange={e => setSelectedAIProvider(e.target.value)}
              onChange={handleProviderInputChange}
            >
              {Object.keys(aiProviders).map(provider => (
                <MenuItem key={provider} value={provider}>
                  {provider}
                </MenuItem>
              ))}
            </Select>
            </FormControl>
            {aiProviders[selectedAIProvider].needApi && (
                <Box sx={{
                    position: 'relative', // This makes it so that the PasteBlock is positioned relative to this Box, not the entire document
                }}>
                {showPaste && (
                    <Button
                      onClick={pasteAPIKey}
                      startIcon={< ContentPasteIcon/>}
                    >
                      {t("paste")}
                    </Button>
                )}
                {showPaste && (
                    <Button
                      onClick={clearAPIKey}
                      startIcon={< ClearIcon/>}
                    >
                      {t("clear")}
                    </Button>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label={t('openai api key')}
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.openaiKey}
                    // value={aiProviders[selectedAIProvider].api}
                    onChange={handleInputChange}
                    onBlur={delay_clear_paste_on_blur}
                    onFocus={delay_clear_paste_on_focus}
                />
                </Box>
            )}
            {/* <Accordion> */}
                {/* <AccordionSummary aria-controls="panel1a-content">
                    <Typography>API URL</Typography>
                </AccordionSummary>
                <AccordionDetails> */}
            <TextField
                margin="dense"
                label="API URL"
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.apiUrl}
                onChange={(e) => setSettingsEdit({ ...settingsEdit, apiUrl: e.target.value.trim() })}
            />

            {/* {
                !settingsEdit.apiUrl.match(/^(https?:\/\/)?api.openai.com(:\d+)?$/) && (
                    <Alert severity="warning">
                        {t('proxy warning', {apiHost:settingsEdit.apiUrl })}
                        <Button onClick={() => setSettingsEdit({ ...settingsEdit, apiUrl: getDefaultSettings().apiUrl })}>{t('reset')}</Button>
                    </Alert>
                )
            } */}
            {
                settingsEdit.apiUrl.startsWith('http://') && (
                    <Alert severity="warning">
                        {<Trans
                        i18nKey="protocol warning"
                        components={{ bold: <strong /> }}
                        />}
                    </Alert>
                )
            }
            {
                !settingsEdit.apiUrl.startsWith('http') && (
                    <Alert severity="error">
                        {<Trans
                        i18nKey="protocol error"
                        components={{ bold: <strong /> }}
                        />}
                    </Alert>
                )
            }

                {/* </AccordionDetails> */}
            {/* </Accordion> */}
            <FormControl fullWidth variant="outlined" margin="dense">
                <InputLabel htmlFor="language-select">{t('language')}</InputLabel>
                <Select
                    label="language"
                    id="language-select"
                    value={settingsEdit.language}
                    onChange={(e) => {
                        setSettingsEdit({ ...settingsEdit, language: e.target.value });
                    }}>
                    {languages.map((language) => (
                        <MenuItem key={language} value={language}>
                            {languageMap[language]}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl sx={{ flexDirection: 'row', alignItems: 'center', paddingTop: 1, paddingBottom: 1 }}>
                <span style={{ marginRight: 10 }}>{t('theme')}</span>
                <ThemeChangeButton value={settingsEdit.theme} onChange={theme => changeModeWithPreview(theme)} />
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <InputLabel>Font Size</InputLabel>
                <Select
                    labelId="select-font-size"
                    value={settingsEdit.fontSize}
                    label="FontSize"
                    onChange={(event) => {
                        setSettingsEdit({ ...settingsEdit, fontSize: event.target.value as number })
                    }}
                >
                    {
                        [12, 13, 14, 15, 16, 17, 18].map((size) => (
                            <MenuItem key={size} value={size}>{size}px</MenuItem>
                        ))
                    }
                </Select>
            </FormControl>
            <FormGroup>
                <FormControlLabel control={<Switch />}
                    label={t('show word count')}
                    checked={settingsEdit.showWordCount}
                    onChange={(e, checked) => setSettingsEdit({ ...settingsEdit, showWordCount: checked })}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel control={<Switch />}
                    label={t('show estimated token count')}
                    checked={settingsEdit.showTokenCount}
                    onChange={(e, checked) => setSettingsEdit({ ...settingsEdit, showTokenCount: checked })}
                />
            </FormGroup>
            
                <Accordion>
                    <AccordionSummary
                        aria-controls="panel1a-content"
                    >
                        <Typography>{t('model')} & {t('token')} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Alert severity="warning">
                            {t('settings modify warning')}
                            {t('please make sure you know what you are doing.')}
                            {t('click here to')}
                            <Button onClick={() => setSettingsEdit({
                                ...settingsEdit,
                                model: getDefaultSettings(selectedAIProvider).model,
                                maxContextSize: getDefaultSettings(selectedAIProvider).maxContextSize,
                                maxTokens: getDefaultSettings(selectedAIProvider).maxTokens,
                                showModelName: getDefaultSettings(selectedAIProvider).showModelName,
                                temperature: getDefaultSettings(selectedAIProvider).temperature,
                            })}>{t('reset')}</Button>
                            {t('to default values.')}
                        </Alert>

                        <FormControl fullWidth variant="outlined" margin="dense">
                            <InputLabel htmlFor="model-select">{t('model')}</InputLabel>
                            <Select
                                label="Model"
                                id="model-select"
                                value={settingsEdit.model}
                                onChange={
                                    (e) => {
                                        setSettingsEdit({ ...settingsEdit, model: e.target.value });
                                        setSelectedModel(e.target.value);
                                    }
                                }>
                                {/* {models.map((model) => (
                                    <MenuItem key={model} value={model}>
                                        {model}
                                    </MenuItem>
                                ))} */}
                                {Object.keys(aiProviders[selectedAIProvider].models).map((model) => (
                                    <MenuItem key={model} value={model}>
                                        {model}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ marginTop: 3, marginBottom: 1 }}>
                            <Typography id="discrete-slider" gutterBottom>
                                {t('temperature')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <Box sx={{ width: '100%' }}>
                                <Slider
                                    value={settingsEdit.temperature}
                                    onChange={handleTemperatureChange}
                                    aria-labelledby="discrete-slider"
                                    valueLabelDisplay="auto"
                                    defaultValue={settingsEdit.temperature}
                                    step={0.1}
                                    min={0}
                                    max={2}
                                    marks={[
                                        {
                                            value: 0.2,
                                            label: <Chip size='small' icon={<PlaylistAddCheckCircleIcon />} label={t('meticulous')} />
                                        },
                                        {
                                            value: 0.8,
                                            label: <Chip size='small' icon={<LightbulbCircleIcon />} label={t('creative')} />
                                        },
                                    ]}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ marginTop: 3, marginBottom: -1 }}>
                            <Typography id="discrete-slider" gutterBottom>
                                {t('max tokens in context')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <Box sx={{ width: '92%' }}>
                                <Slider
                                    value={settingsEdit.maxContextSize === 'inf' ? 32728 : Number(settingsEdit.maxContextSize)}
                                    onChange={handleMaxContextSliderChange}
                                    aria-labelledby="discrete-slider"
                                    valueLabelDisplay="auto"
                                    defaultValue={settingsEdit.maxContextSize === 'inf' ? 32728 : Number(settingsEdit.maxContextSize)}
                                    step={128}
                                    min={minMaxContentLength}
                                    max={maxMaxContentLength}
                                />
                            </Box>
                            <TextField
                                sx={{ marginLeft: 2 }}
                                value={settingsEdit.maxContextSize}
                                onChange={handleMaxContextInputChange}
                                type="text"
                                size="small"
                                variant="outlined"
                            />
                        </Box>

                        <Box sx={{ marginTop: 3, marginBottom: -1 }}>
                            <Typography id="discrete-slider" gutterBottom>
                                {t('max tokens per reply')}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <Box sx={{ width: '92%' }}>
                                <Slider
                                    value={settingsEdit.maxTokens === 'inf' ? 32728 : Number(settingsEdit.maxTokens)}
                                    defaultValue={settingsEdit.maxTokens === 'inf' ? 32728 : Number(settingsEdit.maxTokens)}
                                    onChange={handleRepliesTokensSliderChange}
                                    aria-labelledby="discrete-slider"
                                    valueLabelDisplay="auto"
                                    step={128}
                                    min={minMaxGenerateLength}
                                    max={maxMaxGenerateLength}
                                />
                            </Box>
                            <TextField
                                sx={{ marginLeft: 2 }}
                                value={settingsEdit.maxTokens}
                                onChange={handleRepliesTokensInputChange}
                                type="text"
                                size="small"
                                variant="outlined"
                            />
                        </Box>

                        <FormGroup>
                            <FormControlLabel control={<Switch />}
                                label={t('show model name')}
                                checked={settingsEdit.showModelName}
                                onChange={(e, checked) => setSettingsEdit({ ...settingsEdit, showModelName: checked })}
                            />
                        </FormGroup>

                    </AccordionDetails>
                </Accordion>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={() => props.save(settingsEdit)}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    );
}

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&:before': {
        display: 'none',
    },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
        {...props}
    />
))(({ theme }) => ({
    backgroundColor:
        theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, .05)'
            : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
}));
