import { Page, Locator, expect } from '@playwright/test';

// Константы для селекторов
const SELECTORS = {
  OVERLAY: '.checkselect-over',
  THEME_CHECKBOX: 'input[type="checkbox"][name="type"]',
  SELECTED_THEME: '.checkselect-selected, [class*="selected"], [class*="checked"]',
} as const;

// Константы для таймаутов
const TIMEOUTS = {
  DROPDOWN_OPEN: 2000,
  ELEMENT_ACTION: 1000,
  PREVIEW_GENERATION: 5000,
} as const;

export class EventsWidgetPage {
  readonly page: Page;
  
  // Основные элементы
  readonly pageTitle: Locator;
  readonly mainHeading: Locator;
  
  // Шаг 1: Тематика (используется combobox/select)
  readonly step1Section: Locator;
  readonly themeCombobox: Locator;
  
  // Шаг 2: Страны (используется combobox/select)
  readonly step2Section: Locator;
  readonly countryCombobox: Locator;
  
  // Шаг 3: Размер блока
  readonly step3Section: Locator;
  readonly widthInput: Locator;
  readonly heightInput: Locator;
  readonly fullWidthCheckbox: Locator;
  readonly fullHeightCheckbox: Locator;
  
  // Шаг 4: Цветовая гамма
  readonly step4Section: Locator;
  readonly lightThemeRadio: Locator;
  readonly darkThemeRadio: Locator;
  
  // Кнопки действий
  readonly generatePreviewButton: Locator;
  readonly copyCodeButton: Locator;
  readonly generatedCode: Locator;
  readonly previewContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Основные элементы
    this.pageTitle = page.locator('title');
    this.mainHeading = page.locator('h1');
    
    // Шаг 1: Тематика (combobox/select)
    this.step1Section = page.locator('text=/Шаг 1/i').first();
    // Ищем combobox рядом с текстом "Выберите тематику"
    this.themeCombobox = page.locator('text=/Выберите тематику/i').locator('..').locator('select, [role="combobox"], combobox').first();
    
    // Шаг 2: Страны (combobox/select)
    this.step2Section = page.locator('text=/Шаг 2/i').first();
    // Ищем combobox рядом с текстом "Выберите страны"
    this.countryCombobox = page.locator('text=/Выберите страны/i').locator('..').locator('select, [role="combobox"], combobox').first();
    
    // Шаг 3: Размер блока
    this.step3Section = page.locator('text=/Шаг 3/i').first();
    // Ищем textbox рядом с текстом "Ширина, px:"
    this.widthInput = page.locator('text=/Ширина, px:/i').locator('..').locator('input[type="text"], textbox').first();
    // Ищем textbox рядом с текстом "Высота, px:"
    this.heightInput = page.locator('text=/Высота, px:/i').locator('..').locator('input[type="text"], textbox').first();
    // Чекбокс "на всю ширину контейнера"
    this.fullWidthCheckbox = page.locator('text=/на всю ширину контейнера/i').locator('..').locator('input[type="checkbox"]').first();
    // Чекбокс "на всю высоту блока"
    this.fullHeightCheckbox = page.locator('text=/на всю высоту блока/i').locator('..').locator('input[type="checkbox"]').first();
        
    // Шаг 4: Цветовая гамма
    this.step4Section = page.locator('text=/Шаг 4/i').first();
    // Ищем label с текстом и берём связанный input[type="radio"]
    this.lightThemeRadio = page.locator('text=/Светлая тема/i').locator('..').locator('input[type="radio"], label input[type="radio"]').first();
    this.darkThemeRadio = page.locator('text=/Темная тема/i').locator('..').locator('input[type="radio"], label input[type="radio"]').first();

    // Кнопки действий
    this.generatePreviewButton = page.locator('button:has-text("Сгенерировать превью")');
    this.copyCodeButton = page.locator('button:has-text("Скопировать код")');
    // Сгенерированный код находится в textbox[disabled]
    this.generatedCode = page.locator('textbox[disabled], textarea[disabled], input[disabled]').filter({ hasText: /iframe|script/i });
    this.previewContainer = page.locator('[id*="preview"], [class*="preview"], iframe');
  }

  async open() {
    await this.page.goto('/eventswidget/');
    await this.page.waitForLoadState('networkidle');
    // Ожидаем появления основного заголовка для подтверждения загрузки
    await this.mainHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async isLoaded(): Promise<boolean> {
    return this.page.url().includes('eventswidget');
  }

  // Приватные вспомогательные методы
  private async openComboboxOverlay(overlayIndex: number = 0): Promise<void> {
    const overlays = this.page.locator(SELECTORS.OVERLAY);
    const overlay = overlayIndex === 0 ? overlays.first() : overlays.nth(overlayIndex);
    
    if (await overlay.count() > 0) {
      await overlay.click();
      // Ожидаем открытия выпадающего списка
      await overlay.waitFor({ state: 'visible', timeout: TIMEOUTS.DROPDOWN_OPEN });
    } else {
      // Fallback: кликаем по самому combobox
      const combobox = overlayIndex === 0 ? this.themeCombobox : this.countryCombobox;
      await combobox.click({ force: true });
    }
  }

  private async findAndClickOption(optionText: string | RegExp, options: { force?: boolean } = {}): Promise<boolean> {
    const textPattern = typeof optionText === 'string' ? new RegExp(optionText, 'i') : optionText;
    const locators = [
      this.page.locator(`text=${textPattern}`).first(),
      this.page.locator(`label:has-text("${typeof optionText === 'string' ? optionText : ''}")`).first(),
    ];

    for (const locator of locators) {
      if (await locator.count() > 0) {
        try {
          await locator.click({ force: options.force, timeout: TIMEOUTS.ELEMENT_ACTION });
          return true;
        } catch {
          continue;
        }
      }
    }
    return false;
  }

  //Методы для работы с тематикой (Шаг 1) - используем combobox/select
  async selectTheme(themeName: string): Promise<void> {
    await this.openComboboxOverlay(0);
    
    // Ищем опцию по тексту
    const textOption = this.page.locator(`text=/^${themeName}$/i`).first();
    
    // Пробуем найти и кликнуть чекбокс рядом с текстом
    const checkboxLocators = [
      textOption.locator('input[type="checkbox"]').first(),
      textOption.locator('..').locator('input[type="checkbox"]').first(),
      textOption.locator('../..').locator('input[type="checkbox"]').first(),
    ];

    let success = false;
    for (const checkboxLocator of checkboxLocators) {
      if (await checkboxLocator.count() > 0) {
        try {
          await checkboxLocator.check({ force: true, timeout: TIMEOUTS.ELEMENT_ACTION });
          success = true;
          break;
        } catch {
          continue;
        }
      }
    }

    // Если чекбокс не найден, пробуем кликнуть по тексту или label
    if (!success) {
      success = await this.findAndClickOption(themeName, { force: true });
    }

        // Последняя попытка - поиск по всем чекбоксам
    if (!success) {
      const allCheckboxes = this.page.locator(SELECTORS.THEME_CHECKBOX);
      const count = await allCheckboxes.count();
      
      for (let i = 0; i < count; i++) {        
        const checkbox = allCheckboxes.nth(i);
        try {
          const containerText = (await checkbox.locator('..').textContent()) || '';
          if (new RegExp(themeName, 'i').test(containerText)) {
            // Если видим — чекним обычно
            if (await checkbox.isVisible()) {
              await checkbox.check({ force: true, timeout: TIMEOUTS.ELEMENT_ACTION });
            } else {
              // Если скрыт — устанавливаем checked через evaluate
              const handle = await checkbox.elementHandle();
              if (handle) {
                await this.page.evaluate((el: any) => {
                  const input = el as any;
                  input.checked = true;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }, handle);
              }
            }
            success = true;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!success) {
      throw new Error(`Не удалось выбрать тематику "${themeName}"`);
    }

    // Ожидаем обновления состояния
    await this.themeCombobox.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async selectAllThemes(): Promise<void> {
    await this.openComboboxOverlay(0);
    
    // Ищем опцию "Выбрать все" или "Все"
    const success = await this.findAndClickOption(/Выбрать все|^Все$/i);
    
    if (!success) {
      throw new Error('Не удалось найти опцию "Выбрать все"');
    }

    await this.themeCombobox.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async clearThemes(): Promise<void> {
    await this.openComboboxOverlay(0);
    
    const success = await this.findAndClickOption(/Очистить/i);
    
    if (!success) {
      throw new Error('Не удалось найти опцию "Очистить"');
    }

    await this.themeCombobox.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async isThemeSelected(themeName: string): Promise<boolean> {
    const themePattern = new RegExp(themeName, 'i');
    
    // Способ 1: Проверяем видимый текст в combobox
    try {
      const comboboxText = await this.themeCombobox.textContent({ timeout: TIMEOUTS.ELEMENT_ACTION });
      if (comboboxText && themePattern.test(comboboxText)) {
        return true;
      }
    } catch {
      // Продолжаем
    }
    
    // Способ 2: Проверяем через выбранные элементы
    const selectedText = this.page.locator(SELECTORS.SELECTED_THEME).filter({
      hasText: themePattern
    }).first();
    
    if (await selectedText.count() > 0) {
      return true;
    }
    
    // Способ 3: Ищем чекбокс и проверяем его состояние
    const allCheckboxes = this.page.locator(SELECTORS.THEME_CHECKBOX);
    const count = await allCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      try {
        const checkbox = allCheckboxes.nth(i);
        const isChecked = await checkbox.isChecked({ timeout: TIMEOUTS.ELEMENT_ACTION });
        
        if (isChecked) {
          // Проверяем текст в родительских элементах
          const container = checkbox.locator('..');
          const text = await container.textContent();
          
          if (text && themePattern.test(text)) {
            return true;
          }
          
          // Проверяем в родителе родителя
          const parentText = await container.locator('..').textContent();
          if (parentText && themePattern.test(parentText)) {
            return true;
          }
        }
      } catch {
        continue;
      }
    }
    
    // Способ 4: Проверяем значение select (если это стандартный select)
    try {
      const selectedValue = await this.themeCombobox.inputValue({ timeout: TIMEOUTS.ELEMENT_ACTION });
      if (selectedValue && selectedValue.toLowerCase().includes(themeName.toLowerCase())) {
        return true;
      }
    } catch {
      // Не стандартный select
    }
    
    return false;
  }

  // Методы для работы со странами (Шаг 2) - используем combobox/select
  async selectAllCountries(): Promise<void> {
    // Пробуем использовать стандартный метод selectOption
    try {
      await this.countryCombobox.selectOption({ label: 'Все страны' });
      return;
    } catch {
      // Если это кастомный combobox, используем overlay
    }
    
    await this.openComboboxOverlay(1);
    
    const success = await this.findAndClickOption(/Все страны|Выбрать все/i, { force: true });
    
    if (!success) {
      throw new Error('Не удалось найти опцию "Все страны"');
    }

    await this.countryCombobox.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async clearCountries(): Promise<void> {
    // Пробуем использовать стандартный метод selectOption
    try {
      await this.countryCombobox.selectOption({ index: 0 });
      return;
    } catch {
      // Если это кастомный combobox, используем overlay
    }
    
    await this.openComboboxOverlay(1);
    
    const success = await this.findAndClickOption(/Очистить/i, { force: true });
    
    if (!success) {
      throw new Error('Не удалось найти опцию "Очистить"');
    }

    await this.countryCombobox.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  // Методы для работы с размером (Шаг 3)
  async setWidth(width: number): Promise<void> {
    await this.widthInput.fill(width.toString());
    // Ожидаем обновления значения
    await expect(this.widthInput).toHaveValue(width.toString(), { timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async setHeight(height: number): Promise<void> {
    await this.heightInput.fill(height.toString());
    // Ожидаем обновления значения
    await expect(this.heightInput).toHaveValue(height.toString(), { timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  private async toggleCheckboxByLabel(labelText: RegExp, checkbox: Locator, enabled: boolean): Promise<void> {
    const label = this.page.locator(`text=${labelText}`).first();
    
    if (await label.count() > 0) {
      const currentState = await checkbox.isChecked().catch(() => false);
      if (currentState !== enabled) {
        await label.click();
      }
    } else {
      if (enabled) {
        await checkbox.check({ force: true });
      } else {
        await checkbox.uncheck({ force: true });
      }
    }
    
    // Ожидаем изменения состояния
    if (enabled) {
      await expect(checkbox).toBeChecked({ timeout: TIMEOUTS.ELEMENT_ACTION });
    } else {
      await expect(checkbox).not.toBeChecked({ timeout: TIMEOUTS.ELEMENT_ACTION });
    }
  }

  async setFullWidth(enabled: boolean): Promise<void> {
    await this.toggleCheckboxByLabel(/на всю ширину контейнера/i, this.fullWidthCheckbox, enabled);
  }

  async setFullHeight(enabled: boolean): Promise<void> {
    await this.toggleCheckboxByLabel(/на всю высоту блока/i, this.fullHeightCheckbox, enabled);
  }

  // Методы для работы с цветовой гаммой (Шаг 4)
  private async selectThemeByLabel(labelText: RegExp, radioButton: Locator): Promise<void> {
    const label = this.page.locator(`text=${labelText}`).locator('..').locator('label, input[type="radio"]').first();
    
    if (await label.count() > 0) {
      await label.click();
    } else {
      await radioButton.check({ force: true });
    }
    
    // Ожидаем изменения состояния
    await expect(radioButton).toBeChecked({ timeout: TIMEOUTS.ELEMENT_ACTION });
  }

  async selectLightTheme(): Promise<void> {
    await this.selectThemeByLabel(/Светлая тема:/i, this.lightThemeRadio);
  }

  async selectDarkTheme(): Promise<void> {
    await this.selectThemeByLabel(/Темная тема:/i, this.darkThemeRadio);
  }

  // Методы для действий
  async generatePreview(): Promise<void> {
    await this.generatePreviewButton.click();
    // Ожидаем появления сгенерированного кода вместо фиксированного таймаута
    await this.generatedCode.waitFor({ state: 'visible', timeout: TIMEOUTS.PREVIEW_GENERATION });
  }

  async copyCode(): Promise<void> {
    // Обрабатываем диалог разрешения на доступ к clipboard, если он появится
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 2000 }).catch(() => null);
    
    await this.copyCodeButton.click();
    
    // Если появился диалог, принимаем разрешение
    const dialog = await dialogPromise;
    if (dialog) {
      await dialog.accept();
    }
    
    // Ожидаем завершения операции копирования
    await this.page.waitForTimeout(500); // Clipboard API не имеет события завершения
  }

  async getGeneratedCode(): Promise<string> {
    const codeElement = this.generatedCode.first();
    
    // Пробуем получить значение разными способами в зависимости от типа элемента
    try {
      return await codeElement.inputValue({ timeout: TIMEOUTS.ELEMENT_ACTION });
    } catch {
      // Если это не input/textarea, получаем текстовое содержимое
      const text = await codeElement.textContent({ timeout: TIMEOUTS.ELEMENT_ACTION });
      return text || '';
    }
  }
}
