import type { Application, Trip } from '../types';

export const mockApplications: Application[] = [
  {
    id: '00123',
    from: 'Москва, ул. Ленина, 10',
    to: 'Санкт-Петербург, Невский пр., 25',
    weight: '1500 кг',
    loadingDate: '05.06.2025',
    dimensions: '3x2x2 м',
    price: '45 000 ₽'
  },
  {
    id: '00124',
    from: 'Казань, ул. Баумана, 5',
    to: 'Уфа, пр. Октября, 12',
    weight: '800 кг',
    loadingDate: '06.06.2025',
    dimensions: '2x1.5x1.5 м',
    price: '28 000 ₽',
  },
  {
    id: '00125',
    from: 'Екатеринбург, ул. Малышева, 3',
    to: 'Челябинск, ул. Кирова, 7',
    weight: '2200 кг',
    loadingDate: '07.06.2025',
    dimensions: '4x2.5x2 м',
    price: '32 000 ₽'
  },
];

export const mockTrips: Trip[] = [
  {
    id: 'R00101',
    route: 'Москва → Тверь',
    client: 'ООО «Альфа»',
    driver: 'Иванов И.И.',
    vehicle: 'КАМАЗ 5320',
    status: 'in_transit',
    loadingDate: '01.06.2025',
  },
  {
    id: 'R00102',
    route: 'СПб → Новгород',
    client: 'ИП Петров',
    driver: 'Сидоров А.В.',
    vehicle: 'МАЗ 5440',
    status: 'awaiting',
    loadingDate: '03.06.2025',
  },
  {
    id: 'R00103',
    route: 'Казань → Уфа',
    client: 'ООО «Бета»',
    driver: 'Козлов П.С.',
    vehicle: 'Volvo FH',
    status: 'problem',
    loadingDate: '02.06.2025',
  },
  {
    id: 'R00104',
    route: 'Екатеринбург → Челябинск',
    client: 'ООО «Гамма»',
    driver: 'Новиков Д.А.',
    vehicle: 'Scania R',
    status: 'delayed',
    loadingDate: '04.06.2025',
  },
  {
    id: 'R00105',
    route: 'Нижний Новгород → Самара',
    client: 'ООО «Дельта»',
    driver: 'Морозов Е.К.',
    vehicle: 'Mercedes Actros',
    status: 'completed',
    loadingDate: '28.05.2025',
  },
  {
    id: 'R00106',
    route: 'Воронеж → Ростов',
    client: 'ООО «Эпсилон»',
    driver: 'Волков М.Н.',
    vehicle: 'DAF XF',
    status: 'in_transit',
    loadingDate: '05.06.2025',
  },
  {
    id: 'R00107',
    route: 'Краснодар → Сочи',
    client: 'ИП Смирнов',
    driver: 'Лебедев О.П.',
    vehicle: 'MAN TGX',
    status: 'awaiting',
    loadingDate: '06.06.2025',
  },
];
