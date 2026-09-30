import Link from "next/link";

export default function HomePage() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">L</div>
          <div>
            <b>Lingua</b>
            <span>кабинет изучения языков</span>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn secondary" href="/login">
            Вход
          </Link>
          <Link className="btn" href="/register">
            Регистрация
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>Слова, уроки и прогресс в одном кабинете</h1>
          <p>
            Lingua помогает собирать собственный словарь, готовить уроки, искать записи,
            получать перевод и следить за результатами. Интерфейс адаптивный и полностью
            на русском языке.
          </p>
          <p>
            <Link className="btn" href="/register">
              Начать занятия
            </Link>
          </p>
        </div>
        <div className="panel">
          <h3>Что внутри</h3>
          <p>Регистрация и вход с проверкой данных и шифрованием паролей.</p>
          <p>CRUD для слов и уроков, поиск и сортировка.</p>
          <p>Перевод через MyMemory и уведомления по SSE.</p>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Словарь</h3>
          <p>Карточки слов с переводом, транскрипцией, тегами и уровнем усвоения.</p>
        </article>
        <article className="card">
          <h3>Уроки</h3>
          <p>Собственные материалы по уровням A1–C2 с поиском по названию и тексту.</p>
        </article>
        <article className="card">
          <h3>Прогресс</h3>
          <p>Сводка по словарю, освоенным словам и распределению по языкам.</p>
        </article>
      </section>
      <div className="footer">Курсовой проект · Next.js, REST API, MongoDB</div>
    </div>
  );
}
