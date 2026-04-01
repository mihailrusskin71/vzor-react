// src/pages/FAQPage.jsx
import React, { useState } from 'react';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (index) => {
    if (openItems.includes(index)) {
      setOpenItems(openItems.filter(i => i !== index));
    } else {
      setOpenItems([...openItems, index]);
    }
  };

  const faqItems = [
    {
      question: 'Что такое VzorRos?',
      answer: 'VzorRos — это агрегатор ссылок на легальный контент из российских онлайн-кинотеатров. Мы помогаем найти, на какой платформе доступен фильм или сериал, и сразу перейти к просмотру.'
    },
    {
      question: 'Это бесплатно?',
      answer: 'Да, использование сайта абсолютно бесплатно. Мы зарабатываем на партнерских отчислениях от онлайн-кинотеатров, когда вы переходите по ссылкам и оформляете подписки.'
    },
    {
      question: 'Нужна ли регистрация?',
      answer: 'Нет, регистрация не требуется. Профиль создается автоматически при первом посещении и хранится локально в вашем браузере. Вы можете сохранять фильмы и видеть историю просмотров без создания аккаунта.'
    },
    {
      question: 'Где хранятся мои данные?',
      answer: 'Все данные (сохраненные фильмы, история просмотров) хранятся только в вашем браузере. Мы не отправляем их на сервер и не имеем к ним доступа. Вы можете в любой момент очистить их в настройках профиля.'
    },
    {
      question: 'Почему я не могу посмотреть фильм прямо на сайте?',
      answer: 'Мы не храним видеофайлы и не являемся онлайн-кинотеатром. Мы только предоставляем ссылки на официальные источники, где фильм доступен легально. Это поддерживает правообладателей и развитие киноиндустрии.'
    },
    {
      question: 'На каких устройствах работает сайт?',
      answer: 'Сайт адаптирован под все устройства: компьютеры, планшеты и смартфоны. Вы можете пользоваться им где угодно, главное — наличие интернета.'
    },
    {
      question: 'Как часто обновляется контент?',
      answer: 'Мы стараемся обновлять базу фильмов ежедневно, добавляя новинки и актуальные ссылки. Если вы не нашли какой-то фильм, напишите нам, и мы постараемся его добавить.'
    },
    {
      question: 'Что означают иконки партнеров на карточках?',
      answer: 'Иконка показывает, на какой платформе доступен фильм. При клике на иконку вы сразу перейдете на страницу фильма в этом онлайн-кинотеатре.'
    },
    {
      question: 'Как сохранить фильм?',
      answer: 'Нажмите на иконку закладки на карточке фильма или кнопку "Сохранить" на детальной странице. Фильм появится в разделе "Сохраненные" вашего профиля.'
    },
    {
      question: 'Как очистить историю просмотров?',
      answer: 'Перейдите в профиль, выберите вкладку "История просмотров" и нажмите кнопку "Очистить историю просмотров". Также можно очистить все данные через меню "Очистить данные" внизу страницы.'
    },
    {
      question: 'Что такое cookie и зачем вы их используете?',
      answer: 'Cookie — это небольшие файлы, которые сохраняются в вашем браузере. Мы используем их для сохранения вашего ID и настроек. Вы можете принять или отклонить cookie при первом посещении.'
    },
    {
      question: 'Как связаться с поддержкой?',
      answer: 'Напишите нам на email support@vzorros.ru или через форму обратной связи. Мы стараемся отвечать в течение 24 часов.'
    }
  ];

  return (
    <div className="page-content">
      <div className="content-wrapper-1100" style={{ padding: '40px 0' }}>
        <div className="faq-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '48px', color: 'white', marginBottom: '20px' }}>
            Часто задаваемые <span style={{ color: '#FF6A2B' }}>вопросы</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#aaa', maxWidth: '600px', margin: '0 auto' }}>
            Здесь вы найдете ответы на самые популярные вопросы о нашем сервисе
          </p>
        </div>

        <div className="faq-search" style={{
          maxWidth: '600px',
          margin: '0 auto 40px',
          position: 'relative'
        }}>
          <input
            type="text"
            placeholder="🔍 Поиск по вопросам..."
            style={{
              width: '100%',
              padding: '15px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 106, 43, 0.3)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px'
            }}
          />
        </div>

        <div className="faq-categories" style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap'
        }}>
          {['Все', 'О сервисе', 'Профиль', 'Контент', 'Техническое'].map(cat => (
            <button
              key={cat}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255, 106, 43, 0.3)',
                borderRadius: '20px',
                color: '#ccc',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 106, 43, 0.1)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#ccc';
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="faq-list" style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="faq-item"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                marginBottom: '15px',
                border: '1px solid rgba(255, 106, 43, 0.2)',
                overflow: 'hidden'
              }}
            >
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{item.question}</span>
                <span style={{
                  color: '#FF6A2B',
                  fontSize: '20px',
                  transform: openItems.includes(index) ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s ease'
                }}>
                  {openItems.includes(index) ? '×' : '+'}
                </span>
              </button>
              
              {openItems.includes(index) && (
                <div
                  className="faq-answer"
                  style={{
                    padding: '0 20px 20px 20px',
                    color: '#aaa',
                    lineHeight: '1.6',
                    animation: 'slideDown 0.3s ease'
                  }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact" style={{
          textAlign: 'center',
          marginTop: '60px',
          padding: '40px',
          background: 'linear-gradient(135deg, rgba(255, 106, 43, 0.1), rgba(0, 0, 0, 0.5))',
          borderRadius: '16px',
          border: '1px solid rgba(255, 106, 43, 0.3)'
        }}>
          <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>
            Не нашли ответ на свой вопрос?
          </h2>
          <p style={{ color: '#ccc', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
            Напишите нам, и мы поможем разобраться с любой проблемой
          </p>
          <a
            href="mailto:support@vzorros.ru"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: '#FF6A2B',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ff853d';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(255, 106, 43, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#FF6A2B';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Написать в поддержку
          </a>
        </div>

        <style jsx="true">{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FAQPage;