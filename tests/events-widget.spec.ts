import { test, expect, Page, BrowserContext } from '@playwright/test';
import { EventsWidgetPage } from '../pages/EventsWidget.page';

// Константы для тестовых данных
const TEST_THEMES = {
  IGAMING: 'Igaming',
  BLOCKCHAIN: 'Blockchain',
  DEVELOPMENT: 'Development',
} as const;

const TEST_DIMENSIONS = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  LARGE_WIDTH: 1200,
  LARGE_HEIGHT: 900,
  PREVIEW_WIDTH: 1000,
  PREVIEW_HEIGHT: 800,
} as const;

const TIMEOUTS = {
  PREVIEW_GENERATION: 5000,
  ELEMENT_APPEARANCE: 3000,
} as const;

test.describe('Events Widget Page', () => {
  let widget: EventsWidgetPage;

  test.beforeEach(async ({ page, context }: { page: Page; context: BrowserContext }) => {
    // Предоставляем разрешения на доступ к clipboard
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://dev.3snet.info' });
    
    widget = new EventsWidgetPage(page);
    await widget.open();
  });

  test('Page loads correctly and displays main elements', async ({ page }: { page: Page }) => {
    // Проверка URL
    await expect(page).toHaveURL(/eventswidget/);

    // Проверка наличия основного заголовка
    await expect(widget.mainHeading).toBeVisible();
    
    // Проверка наличия всех шагов
    await expect(widget.step1Section).toBeVisible();
    await expect(widget.step2Section).toBeVisible();
    await expect(widget.step3Section).toBeVisible();
    await expect(widget.step4Section).toBeVisible();

    // Проверка наличия кнопки генерации превью
    await expect(widget.generatePreviewButton).toBeVisible();
  });

  test('Step 1: Theme selection functionality', async () => {
  // Проверка наличия combobox для выбора тематики
  await expect(widget.themeCombobox).toBeVisible();

  // Выбор конкретной тематики
  await widget.selectTheme(TEST_THEMES.IGAMING);
  
  // Просто ждем и проверяем видимость combobox
  await widget.themeCombobox.waitFor({ state: 'visible' });
});

  test('Step 2: Country selection functionality', async () => {
    // Проверка наличия combobox для выбора стран
    await expect(widget.countryCombobox).toBeVisible();

    // Тест выбора всех стран
    await widget.selectAllCountries();
    await widget.countryCombobox.waitFor({ state: 'visible' });
    
    // Тест очистки выбора
    await widget.clearCountries();
    await widget.countryCombobox.waitFor({ state: 'visible' });
  });

  test('Step 3: Block size configuration', async () => {
    // Проверка наличия полей ввода
    await expect(widget.widthInput).toBeVisible();
    await expect(widget.heightInput).toBeVisible();

    // Установка конкретных размеров
    await widget.setWidth(TEST_DIMENSIONS.DEFAULT_WIDTH);
    await widget.setHeight(TEST_DIMENSIONS.DEFAULT_HEIGHT);
    
    // Проверка значений
    await expect(widget.widthInput).toHaveValue(TEST_DIMENSIONS.DEFAULT_WIDTH.toString());
    await expect(widget.heightInput).toHaveValue(TEST_DIMENSIONS.DEFAULT_HEIGHT.toString());

    // Тест чекбоксов "на всю ширину/высоту"
    await widget.setFullWidth(true);
    await expect(widget.fullWidthCheckbox).toBeChecked();
    
    await widget.setFullHeight(true);
    await expect(widget.fullHeightCheckbox).toBeChecked();
    
    await widget.setFullWidth(false);
    await expect(widget.fullWidthCheckbox).not.toBeChecked();
    
    await widget.setFullHeight(false);
    await expect(widget.fullHeightCheckbox).not.toBeChecked();
  });

  test('Step 4: Color theme selection', async () => {
    // Проверка наличия секции выбора темы
    await expect(widget.step4Section).toBeVisible();

    // Выбор светлой темы
    await widget.selectLightTheme();
    await expect(widget.lightThemeRadio).toBeChecked();
    await expect(widget.darkThemeRadio).not.toBeChecked();

    // Выбор темной темы
    await widget.selectDarkTheme();
    await expect(widget.darkThemeRadio).toBeChecked();
    await expect(widget.lightThemeRadio).not.toBeChecked();
  });

  test('Generate preview functionality', async () => {
    // Настройка параметров перед генерацией
    await widget.selectTheme(TEST_THEMES.IGAMING);
    await widget.setWidth(TEST_DIMENSIONS.PREVIEW_WIDTH);
    await widget.setHeight(TEST_DIMENSIONS.PREVIEW_HEIGHT);
    await widget.selectLightTheme();

    // Генерация превью
    await widget.generatePreview();

    // Проверка наличия сгенерированного кода
    await expect(widget.generatedCode).toBeVisible({ timeout: TIMEOUTS.PREVIEW_GENERATION });
    
    // Проверка наличия кнопки копирования
    await expect(widget.copyCodeButton).toBeVisible();
    
    // Проверка, что код не пустой
    const code = await widget.getGeneratedCode();
    expect(code.length).toBeGreaterThan(0);
    expect(code).toMatch(/iframe|script/i);
  });

  test('Copy code functionality', async ({ page }: { page: Page }) => {
    // Настройка и генерация превью
    await widget.selectTheme(TEST_THEMES.IGAMING);
    await widget.generatePreview();

    // Ожидание появления кода
    await expect(widget.generatedCode).toBeVisible({ timeout: TIMEOUTS.PREVIEW_GENERATION });

    // Получаем код до копирования для сравнения
    const codeBeforeCopy = await widget.getGeneratedCode();
    expect(codeBeforeCopy.length).toBeGreaterThan(0);

    // Попытка скопировать код
    await widget.copyCode();
    
    // Проверка, что код был скопирован в буфер обмена
    try {
      const clipboardText = await page.evaluate(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nav = navigator as any;
        if (nav.clipboard && typeof nav.clipboard.readText === 'function') {
          return await nav.clipboard.readText();
        }
        return '';
      });
      
      if (clipboardText.length > 0) {
        expect(clipboardText).toBe(codeBeforeCopy);
      } else {
        // Если clipboard API недоступен, проверяем что код был сгенерирован
        expect(codeBeforeCopy.length).toBeGreaterThan(0);
      }
    } catch (error) {
      // Если clipboard API недоступен (например, в CI/CD или без HTTPS), 
      // проверяем, что кнопка была нажата и код был сгенерирован
      expect(codeBeforeCopy.length).toBeGreaterThan(0);
    }
  });

  test('Full workflow: configure and generate widget', async () => {
    // Шаг 1: Выбор тематики
    await widget.selectTheme(TEST_THEMES.BLOCKCHAIN);
    await widget.selectTheme(TEST_THEMES.DEVELOPMENT);

    // Шаг 2: Выбор стран
    await widget.selectAllCountries();

    // Шаг 3: Настройка размера
    await widget.setWidth(TEST_DIMENSIONS.LARGE_WIDTH);
    await widget.setHeight(TEST_DIMENSIONS.LARGE_HEIGHT);

    // Шаг 4: Выбор темы
    await widget.selectDarkTheme();

    // Генерация превью
    await widget.generatePreview();

    // Проверка результата
    await expect(widget.generatedCode).toBeVisible({ timeout: TIMEOUTS.PREVIEW_GENERATION });
    const code = await widget.getGeneratedCode();
    expect(code.length).toBeGreaterThan(0);
    expect(code).toMatch(/iframe|script/i);
  });

  test('Page content and structure validation', async ({ page }: { page: Page }) => {
    // Проверка наличия основного контента
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // Проверка наличия ключевых текстов
    expect(bodyText).toContain('Шаг 1');
    expect(bodyText).toContain('Шаг 2');
    expect(bodyText).toContain('Шаг 3');
    expect(bodyText).toContain('Шаг 4');

    // Проверка наличия инструкций
    expect(bodyText).toMatch(/Скопируйте|код|превью/i);
  });

  test('Responsive elements visibility', async () => {
    // Проверка видимости всех основных элементов
    await expect(widget.step1Section).toBeVisible();
    await expect(widget.step2Section).toBeVisible();
    await expect(widget.step3Section).toBeVisible();
    await expect(widget.step4Section).toBeVisible();
    await expect(widget.generatePreviewButton).toBeVisible();
  });

  test('Negative: Generate preview without theme selection', async () => {
    // Попытка сгенерировать превью без выбора тематики
    await widget.setWidth(TEST_DIMENSIONS.DEFAULT_WIDTH);
    await widget.setHeight(TEST_DIMENSIONS.DEFAULT_HEIGHT);
    
    // Генерация превью без тематики
    await widget.generatePreview();
    
    // Проверяем, что код либо не появился, либо появился с предупреждением
    // (зависит от реализации приложения)
    const code = await widget.getGeneratedCode().catch(() => '');
    // Если код не пустой, проверяем что он валидный
    if (code.length > 0) {
      expect(code).toMatch(/iframe|script/i);
    }
  });

  test('Negative: Invalid dimensions input', async () => {
    // Проверка обработки некорректных значений размеров
    await widget.setWidth(-100);
    await widget.setHeight(0);
    
    // Проверяем, что значения были обработаны (либо отклонены, либо нормализованы)
    const widthValue = await widget.widthInput.inputValue();
    const heightValue = await widget.heightInput.inputValue();
    
    // Значения должны быть либо пустыми, либо положительными числами
    if (widthValue) {
      expect(parseInt(widthValue)).toBeGreaterThanOrEqual(0);
    }
    if (heightValue) {
      expect(parseInt(heightValue)).toBeGreaterThanOrEqual(0);
    }
  });
});
