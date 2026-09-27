import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // log local; pino/backend já cobre API
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas p-6">
          <div className="max-w-md rounded-2xl border border-border bg-white p-6 text-center">
            <h1 className="text-xl font-bold text-ink">Algo deu errado</h1>
            <p className="mt-2 text-sm text-muted">Recarregue a página. Se persistir, faça login novamente.</p>
            <button
              type="button"
              onClick={() => window.location.assign("/home")}
              className="mt-4 h-11 w-full rounded-full bg-primary text-sm font-bold text-white"
            >
              Voltar ao início
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
