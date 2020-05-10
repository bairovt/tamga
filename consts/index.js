const measureUnits = ['шт', 'м', 'м2', 'кг'];

const packTypes = [
  {
    value: 'CT',
    label: 'Коробка, картонная',
  },
  {
    value: 'CR',
    label: 'Ящик, решетчатый (или обрешетка)',
  },
  {
    value: '44',
    label: 'Мешок полиэтиленовый',
  },
  {
    value: '5H',
    label: 'Мешок из полимерной ткани',
  },
  {
    value: '7B',
    label: 'Ящик деревянный',
  },
  {
    value: 'PX',
    label: 'Поддон',
  },
  {
    value: 'BE',
    label: 'Пакет (пачка/связка)',
  },
  {
    value: 'NE',
    label: 'Без упаковки',
  },
  {
    value: '00',
    label: 'Добавить тип',
  },
];

module.exports = { measureUnits, packTypes };
