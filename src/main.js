/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   return (sale_price - discount) * quantity;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const {profit} = seller;
        if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    //Этап 2, шаг 1:
    // @TODO: Проверка входных данных
    if (!data 
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
       throw new Error('Некорректные входные данные');
    }

    //Этап 2, шаг 2:
    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if ( !calculateRevenue || !calculateBonus) {
        throw new Error ('Чего-то не хватает');
    }

    //Этап 2, шаг 3:
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
    products_sold: {}
    }));

    //Этап 2, шаг 4:
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.seller_id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

     // Этап 3, шаг 1: Расчёт выручки и прибыли
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        // Увеличиваем количество чеков (продаж)
        seller.sales_count += 1;

        // Выручка берётся из чека целиком
        const totalRevenue = record.total_amount;
        seller.revenue += totalRevenue;

        // Считаем общую себестоимость товаров в чеке
        let totalCost = 0;
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const cost = product.purchase_price * item.quantity;
            totalCost += cost;

            // Обновляем счётчик проданных SKU
            seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
        });

        // Прибыль = выручка - себестоимость
        seller.profit += (totalRevenue - totalCost);
    });

    // Этап 3, шаг 2: Сортировка по прибыли (убывание)
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Этап 3, шаг 3: Бонусы и топ-10 товаров
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    // Этап 3, шаг 4: Финальный результат
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
