import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="not-found">
        <span>
          <SearchX size={28} />
        </span>
        <div className="page-heading__eyebrow">Ошибка 404</div>
        <h1>Страница не найдена</h1>
        <p>Возможно, адрес изменился или был введён с ошибкой.</p>
        <Link className="button button--primary button--md" to="/">
          <ArrowLeft size={16} /> Вернуться к панели
        </Link>
      </div>
    </div>
  )
}
