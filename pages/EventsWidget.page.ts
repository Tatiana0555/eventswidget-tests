import { Page, Locator } from '@playwright/test';

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
    
    // Шаг 4: Цветовая гамма (радиокнопки могут быть скрыты, используем value или клик по label)
    this.step4Section = page.locator('text=/Шаг 4/i').first();
    // Используем поиск по value или name атрибуту
    this.lightThemeRadio = page.locator('input[type="radio"][name*="theme" i], input[type="radio"][value*="blue" i], input[type="radio"][value*="light" i]').first();
    this.darkThemeRadio = page.locator('input[type="radio"][name*="theme" i], input[type="radio"][value*="dark" i]').first();
    
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
  }

  async isLoaded(): Promise<boolean> {
    return this.page.url().includes('eventswidget');
  }

  // Методы для работы с тематикой (Шаг 1) - используем combobox/select
  async selectTheme(themeName: string) {
    // Кликаем по overlay элементу, который перехватывает события
    const overlay = this.page.locator('.checkselect-over').first();
    if (await overlay.count() > 0) {
      await overlay.click();
    } else {
      // Если overlay нет, кликаем по самому select
      await this.themeCombobox.click({ force: true });
    }
    await this.page.waitForTimeout(500); // Даем время на открытие выпадающего списка
    
    // Ищем опцию по тексту в выпадающем списке
    // Элемент может быть невидимым (в выпадающем списке), поэтому используем force
    const textOption = this.page.locator(`text=/^${themeName}$/i`).first();
    const labelOption = this.page.locator(`label:has-text("${themeName}")`).first();
    
    // Сначала пробуем найти чекбокс - он может быть в разных местах относительно текста
    // Вариант 1: чекбокс внутри элемента с текстом
    const checkboxInOption = textOption.locator('input[type="checkbox"]').first();
    // Вариант 2: чекбокс в родительском элементе
    const checkboxInParent = textOption.locator('..').locator('input[type="checkbox"]').first();
    // Вариант 3: чекбокс в том же контейнере (ищем по соседству)
    const checkboxSibling = textOption.locator('../..').locator('input[type="checkbox"]').first();
    
    // Проверяем наличие и кликаем с force (все чекбоксы могут быть невидимыми)
    // Используем try-catch для каждого варианта, так как элемент может быть найден, но недоступен
    let success = false;
    
    // Вариант 1: чекбокс внутри элемента
    if (!success && await checkboxInOption.count() > 0) {
      try {
        await checkboxInOption.check({ force: true, timeout: 2000 });
        success = true;
      } catch (e) {
        // Продолжаем поиск
      }
    }
    
    // Вариант 2: чекбокс в родителе
    if (!success && await checkboxInParent.count() > 0) {
      try {
        await checkboxInParent.check({ force: true, timeout: 2000 });
        success = true;
      } catch (e) {
        // Продолжаем поиск
      }
    }
    
    // Вариант 3: чекбокс в соседнем элементе
    if (!success && await checkboxSibling.count() > 0) {
      try {
        await checkboxSibling.check({ force: true, timeout: 2000 });
        success = true;
      } catch (e) {
        // Продолжаем поиск
      }
    }
    
    // Вариант 4: клик по тексту (может быть ссылка)
    if (!success && await textOption.count() > 0) {
      try {
        await textOption.click({ force: true, timeout: 2000 });
        success = true;
      } catch (e) {
        // Продолжаем поиск
      }
    }
    
    // Вариант 5: клик по label
    if (!success && await labelOption.count() > 0) {
      try {
        await labelOption.click({ force: true, timeout: 2000 });
        success = true;
      } catch (e) {
        // Продолжаем поиск
      }
    }
    
    // Последняя попытка - найти чекбокс через поиск по всему документу
    if (!success) {
      const allCheckboxes = this.page.locator('input[type="checkbox"][name="type"]');
      const checkboxCount = await allCheckboxes.count();
      for (let i = 0; i < checkboxCount; i++) {
        try {
          const checkbox = allCheckboxes.nth(i);
          // Проверяем, есть ли рядом текст с нужным названием
          const container = checkbox.locator('..');
          const text = await container.textContent();
          if (text && new RegExp(themeName, 'i').test(text)) {
            await checkbox.check({ force: true, timeout: 2000 });
            success = true;
            break;
          }
        } catch (e) {
          // Продолжаем поиск
        }
      }
    }
    await this.page.waitForTimeout(300);
  }

  async selectAllThemes() {
    // Кликаем по overlay для открытия списка
    const overlay = this.page.locator('.checkselect-over').first();
    if (await overlay.count() > 0) {
      await overlay.click();
    } else {
      await this.themeCombobox.click({ force: true });
    }
    await this.page.waitForTimeout(500);
    
    // Ищем опцию "Выбрать все" или "Все" (используем отдельные локаторы)
    const selectAll1 = this.page.locator('text=/Выбрать все/i').first();
    const selectAll2 = this.page.locator('text=/^Все$/i').first();
    const selectAll3 = this.page.locator('label:has-text("Выбрать все")').first();
    
    if (await selectAll1.count() > 0) {
      await selectAll1.click();
    } else if (await selectAll2.count() > 0) {
      await selectAll2.click();
    } else if (await selectAll3.count() > 0) {
      await selectAll3.click();
    }
    await this.page.waitForTimeout(300);
  }

  async clearThemes() {
    // Кликаем по overlay
    const overlay = this.page.locator('.checkselect-over').first();
    if (await overlay.count() > 0) {
      await overlay.click();
    }
    await this.page.waitForTimeout(500);
    
    // Ищем опцию "Очистить" (используем отдельные локаторы)
    const clearOption1 = this.page.locator('text=/Очистить/i').first();
    const clearOption2 = this.page.locator('label:has-text("Очистить")').first();
    
    if (await clearOption1.count() > 0) {
      await clearOption1.click();
    } else if (await clearOption2.count() > 0) {
      await clearOption2.click();
    }
    await this.page.waitForTimeout(300);
  }

  async isThemeSelected(themeName: string): Promise<boolean> {
    // Для кастомного combobox проверяем несколькими способами
    
    // Способ 1: Проверяем видимый текст в самом combobox (после выбора там должен отображаться выбранный элемент)
    try {
      const comboboxText = await this.themeCombobox.textContent();
      if (comboboxText && new RegExp(themeName, 'i').test(comboboxText)) {
        return true;
      }
    } catch (e) {
      // Продолжаем
    }
    
    // Способ 2: Ищем чекбокс и проверяем его состояние
    // Ищем все чекбоксы с name="type" и проверяем, есть ли рядом нужный текст
    const allCheckboxes = this.page.locator('input[type="checkbox"][name="type"]');
    const checkboxCount = await allCheckboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      try {
        const checkbox = allCheckboxes.nth(i);
        const isChecked = await checkbox.isChecked({ timeout: 1000 });
        if (isChecked) {
          // Проверяем, есть ли рядом текст с нужным названием
          // Проверяем в родительском элементе и его родителе
          const container = checkbox.locator('..');
          const text = await container.textContent();
          if (text && new RegExp(themeName, 'i').test(text)) {
            return true;
          }
          // Проверяем в родителе родителя
          const parentContainer = container.locator('..');
          const parentText = await parentContainer.textContent();
          if (parentText && new RegExp(themeName, 'i').test(parentText)) {
            return true;
          }
        }
      } catch (e) {
        // Продолжаем поиск
      }
    }
    
    // Способ 3: Проверяем через текст в выбранных элементах combobox
    const selectedText = this.page.locator('.checkselect-selected, [class*="selected"], [class*="checked"]').filter({
      hasText: new RegExp(themeName, 'i')
    }).first();
    
    if (await selectedText.count() > 0) {
      return true;
    }
    
    // Способ 4: Проверяем значение select (если это стандартный select)
    try {
      const selectedValue = await this.themeCombobox.inputValue();
      if (selectedValue && selectedValue.toLowerCase().includes(themeName.toLowerCase())) {
        return true;
      }
    } catch (e) {
      // Не стандартный select
    }
    
    // Способ 5: Открываем combobox и проверяем напрямую
    try {
      const overlay = this.page.locator('.checkselect-over').first();
      if (await overlay.count() > 0) {
        const wasOpen = await overlay.isVisible();
        if (!wasOpen) {
          await overlay.click();
          await this.page.waitForTimeout(300);
        }
        
        const textElement = this.page.locator(`text=/^${themeName}$/i`).first();
        if (await textElement.count() > 0) {
          // Проверяем, есть ли рядом чекбокс и отмечен ли он
          const nearbyCheckbox = textElement.locator('..').locator('input[type="checkbox"]').first();
          if (await nearbyCheckbox.count() > 0) {
            const checked = await nearbyCheckbox.isChecked();
            // Закрываем combobox только если мы его открыли
            if (!wasOpen) {
              await overlay.click();
            }
            return checked;
          }
        }
        // Закрываем combobox только если мы его открыли
        if (!wasOpen) {
          await overlay.click();
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }
    
    return false;
  }

  // Методы для работы со странами (Шаг 2) - используем combobox/select
  async selectAllCountries() {
    // Для select элементов используем selectOption вместо клика
    // Пробуем использовать стандартный метод selectOption со строкой
    try {
      await this.countryCombobox.selectOption({ label: 'Все страны' });
    } catch {
      // Если это кастомный combobox, открываем его через overlay
      const overlays = this.page.locator('.checkselect-over');
      const countryOverlay = overlays.nth(1); // Второй overlay для стран
      
      if (await countryOverlay.count() > 0) {
        await countryOverlay.click();
      } else {
        await this.countryCombobox.click({ force: true });
      }
      await this.page.waitForTimeout(500);
      
      // Ищем опцию "Все страны" или "Выбрать все" и кликаем с force
      const allOption1 = this.page.locator('text=/Все страны/i').first();
      const allOption2 = this.page.locator('text=/Выбрать все/i').first();
      const allOption3 = this.page.locator('label:has-text("Все страны")').first();
      
      if (await allOption1.count() > 0) {
        await allOption1.click({ force: true });
      } else if (await allOption2.count() > 0) {
        await allOption2.click({ force: true });
      } else if (await allOption3.count() > 0) {
        await allOption3.click({ force: true });
      }
    }
    await this.page.waitForTimeout(300);
  }

  async clearCountries() {
    // Пробуем использовать selectOption для сброса
    try {
      await this.countryCombobox.selectOption({ index: 0 });
    } catch {
      // Если это кастомный combobox, открываем через overlay
      const overlays = this.page.locator('.checkselect-over');
      const countryOverlay = overlays.nth(1);
      
      if (await countryOverlay.count() > 0) {
        await countryOverlay.click();
      }
      await this.page.waitForTimeout(500);
      
      // Ищем опцию "Очистить" и кликаем с force
      const clearOption1 = this.page.locator('text=/Очистить/i').first();
      const clearOption2 = this.page.locator('label:has-text("Очистить")').first();
      
      if (await clearOption1.count() > 0) {
        await clearOption1.click({ force: true });
      } else if (await clearOption2.count() > 0) {
        await clearOption2.click({ force: true });
      }
    }
    await this.page.waitForTimeout(300);
  }

  // Методы для работы с размером (Шаг 3)
  async setWidth(width: number) {
    await this.widthInput.fill(width.toString());
  }

  async setHeight(height: number) {
    await this.heightInput.fill(height.toString());
  }

  async setFullWidth(enabled: boolean) {
    // Чекбокс скрыт, используем force или кликаем по label
    const label = this.page.locator('text=/на всю ширину контейнера/i').first();
    if (await label.count() > 0) {
      await label.click();
    } else {
      if (enabled) {
        await this.fullWidthCheckbox.check({ force: true });
      } else {
        await this.fullWidthCheckbox.uncheck({ force: true });
      }
    }
  }

  async setFullHeight(enabled: boolean) {
    const label = this.page.locator('text=/на всю высоту блока/i').first();
    if (await label.count() > 0) {
      await label.click();
    } else {
      if (enabled) {
        await this.fullHeightCheckbox.check({ force: true });
      } else {
        await this.fullHeightCheckbox.uncheck({ force: true });
      }
    }
  }

  // Методы для работы с цветовой гаммой (Шаг 4)
  async selectLightTheme() {
    // Ищем радиокнопку по value или name, затем кликаем по label
    // Сначала пробуем найти label рядом с текстом "Светлая тема:"
    const label = this.page.locator('text=/Светлая тема:/i').locator('..').locator('label, input[type="radio"]').first();
    if (await label.count() > 0) {
      await label.click();
    } else {
      // Если не нашли label, используем force для радиокнопки
      await this.lightThemeRadio.check({ force: true });
    }
    await this.page.waitForTimeout(200);
  }

  async selectDarkTheme() {
    const label = this.page.locator('text=/Темная тема:/i').locator('..').locator('label, input[type="radio"]').first();
    if (await label.count() > 0) {
      await label.click();
    } else {
      await this.darkThemeRadio.check({ force: true });
    }
    await this.page.waitForTimeout(200);
  }

  // Методы для действий
  async generatePreview() {
    await this.generatePreviewButton.click();
    await this.page.waitForTimeout(1000); // Даем время на генерацию
  }

  async copyCode() {
    // Обрабатываем диалог разрешения на доступ к clipboard, если он появится
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 2000 }).catch(() => null);
    
    // Кликаем по кнопке копирования
    await this.copyCodeButton.click();
    
    // Если появился диалог, принимаем разрешение
    const dialog = await dialogPromise;
    if (dialog) {
      await dialog.accept();
    }
    
    // Даем время на обработку
    await this.page.waitForTimeout(500);
  }

  async getGeneratedCode(): Promise<string> {
    const codeElement = this.generatedCode.first();
    // Пробуем получить значение разными способами в зависимости от типа элемента
    try {
      return await codeElement.inputValue();
    } catch {
      // Если это не input/textarea, получаем текстовое содержимое
      return await codeElement.textContent() || '';
    }
  }
}
