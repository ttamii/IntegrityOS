import { Info, Github, Linkedin, Mail } from 'lucide-react';

export default function About() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">О проекте IntegrityOS</h1>
                <p className="text-gray-600">Платформа анализа трубопроводов с ML-классификацией</p>
            </div>

            {/* Project Description */}
            <div className="bg-white rounded-lg p-6 card-hover">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary-500" />
                    Описание проекта
                </h2>
                <div className="space-y-4 text-gray-700">
                    <p>
                        <strong className="text-gray-900">IntegrityOS</strong> - это комплексная система для визуализации,
                        хранения и анализа данных обследований магистральных трубопроводов с использованием
                        машинного обучения для классификации рисков.
                    </p>
                    <p>
                        Платформа позволяет импортировать данные из CSV/XLSX файлов, автоматически классифицировать
                        дефекты по уровням риска (низкий, средний, высокий), визуализировать объекты на интерактивной
                        карте и генерировать аналитические отчеты.
                    </p>
                </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-white rounded-lg p-6 card-hover">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Технологический стек</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium text-primary-400 mb-3">Backend</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>• <strong>FastAPI</strong> - современный Python веб-фреймворк</li>
                            <li>• <strong>SQLAlchemy</strong> - ORM для работы с базой данных</li>
                            <li>• <strong>Scikit-learn</strong> - ML-библиотека для классификации</li>
                            <li>• <strong>Pandas</strong> - обработка и анализ данных</li>
                            <li>• <strong>ReportLab</strong> - генерация PDF отчетов</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-primary-400 mb-3">Frontend</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>• <strong>React 18</strong> - UI библиотека</li>
                            <li>• <strong>TypeScript</strong> - типизированный JavaScript</li>
                            <li>• <strong>Tailwind CSS</strong> - utility-first CSS фреймворк</li>
                            <li>• <strong>Leaflet</strong> - интерактивные карты</li>
                            <li>• <strong>Recharts</strong> - графики и визуализация</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg p-6 card-hover">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Основной функционал</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Аналитический дашборд</h3>
                        <p className="text-sm text-gray-600">
                            5 интерактивных графиков с статистикой по обследованиям, дефектам и рискам
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Интерактивная карта</h3>
                        <p className="text-sm text-gray-600">
                            Визуализация объектов с цветовой кодировкой по уровню риска и фильтрами
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">🤖 ML-классификация</h3>
                        <p className="text-sm text-gray-600">
                            RandomForest модель с точностью 94.74% для автоматической оценки рисков
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">📥 Импорт данных</h3>
                        <p className="text-sm text-gray-600">
                            Загрузка CSV/XLSX файлов с валидацией и обработкой ошибок
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Генерация отчетов</h3>
                        <p className="text-sm text-gray-600">
                            Экспорт аналитических отчетов в HTML и PDF форматах
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Поиск и фильтрация</h3>
                        <p className="text-sm text-gray-600">
                            Расширенные фильтры по методам контроля, датам и уровням риска
                        </p>
                    </div>
                </div>
            </div>

            {/* ML Model */}
            <div className="bg-white rounded-lg p-6 card-hover">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ML-модель классификации рисков</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-primary-400">94.74%</div>
                            <div className="text-sm text-gray-600 mt-1">Точность модели</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-primary-400">11</div>
                            <div className="text-sm text-gray-600 mt-1">Признаков</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-primary-400">91</div>
                            <div className="text-sm text-gray-600 mt-1">Дефектов в обучении</div>
                        </div>
                    </div>
                    <p className="text-gray-700">
                        Модель использует RandomForest алгоритм и учитывает качество дефекта, его размеры
                        (глубина, длина, ширина), метод контроля и условия обследования для определения
                        уровня риска.
                    </p>
                </div>
            </div>

            {/* Team */}
            <div className="bg-white rounded-lg p-6 card-hover">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Команда</h2>
                <div className="text-gray-700">
                    <p className="mb-4">
                        Проект разработан для хакатона IntegrityOS в рамках цифровизации
                        процессов управления целостностью магистральных трубопроводов.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                            <Github className="h-5 w-5 mr-2" />
                            GitHub
                        </a>
                        <a href="#" className="flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                            <Linkedin className="h-5 w-5 mr-2" />
                            LinkedIn
                        </a>
                        <a href="#" className="flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                            <Mail className="h-5 w-5 mr-2" />
                            Email
                        </a>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg p-6 card-hover">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Статистика проекта</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">5000+</div>
                        <div className="text-sm text-gray-600">Строк кода</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">50+</div>
                        <div className="text-sm text-gray-600">Файлов</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">20+</div>
                        <div className="text-sm text-gray-600">API endpoints</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">10+</div>
                        <div className="text-sm text-gray-600">React компонентов</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
