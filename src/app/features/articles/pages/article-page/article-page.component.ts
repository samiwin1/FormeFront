import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ArticleService } from '../../services/article.service';
import {
  Article,
  ArticleCategory,
  ArticleComment,
  ArticleLanguage,
  ArticleTargetLanguage,
  TranslatedArticleView,
} from '../../models/article.models';

@Component({
  selector: 'app-article-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-page.component.html',
  styleUrl: './article-page.component.css',
})
export class ArticlePageComponent implements OnInit {
  private readonly articleService = inject(ArticleService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  categories: ArticleCategory[] = ['GUIDE', 'ACTUALITE', 'CONSEIL'];
  articles: Article[] = [];
  loading = false;
  publishing = false;
  error: string | null = null;

  composer = {
    titre: '',
    contenu: '',
    categorie: 'GUIDE' as ArticleCategory,
    image: '',
    resume: '',
  };

  commentDrafts: Record<number, string> = {};
  comments: Record<number, ArticleComment[]> = {};
  commentsLoading: Record<number, boolean> = {};
  commentsOpen: Record<number, boolean> = {};
  editingCommentId: number | null = null;
  commentEditDrafts: Record<number, string> = {};
  savingCommentId: number | null = null;
  deletingCommentId: number | null = null;
  likeLoading: Record<number, boolean> = {};
  deletingArticleId: number | null = null;
  translationLoading: Record<number, boolean> = {};
  selectedLanguage: Record<number, ArticleLanguage> = {};
  translationError: Record<number, string> = {};
  translations: Record<number, Partial<Record<ArticleTargetLanguage, TranslatedArticleView>>> = {};

  ngOnInit(): void {
    this.loadArticles();
  }

  get isLoggedIn(): boolean {
    return !!this.auth.getToken();
  }

  get currentUserId(): number | null {
    return this.auth.getUserId();
  }

  get currentUserLabel(): string {
    return this.auth.getEmail() ?? 'User';
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    this.articleService.listArticles(this.currentUserId ?? undefined).subscribe({
      next: (list) => {
        this.articles = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load articles';
        this.loading = false;
      },
    });
  }

  publish(): void {
    if (!this.isLoggedIn || this.currentUserId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/articles' } });
      return;
    }

    const titre = this.composer.titre.trim();
    const contenu = this.composer.contenu.trim();
    if (!titre || !contenu) {
      this.toast.error('Title and content are required.');
      return;
    }

    this.publishing = true;
    this.articleService.createArticle({
      ownerId: this.currentUserId,
      titre,
      contenu,
      categorie: this.composer.categorie,
      image: this.composer.image.trim() || null,
      resume: this.composer.resume.trim() || null,
      genereParIa: false,
    }).subscribe({
      next: () => {
        this.toast.success('Article published.');
        this.composer = { titre: '', contenu: '', categorie: 'GUIDE', image: '', resume: '' };
        this.publishing = false;
        this.loadArticles();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Could not publish article.');
        this.publishing = false;
      },
    });
  }

  toggleLike(article: Article): void {
    if (!article.id) return;
    if (!this.isLoggedIn || this.currentUserId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/articles' } });
      return;
    }

    this.likeLoading[article.id] = true;
    this.articleService.toggleLike(article.id, this.currentUserId).subscribe({
      next: (updated) => {
        this.replaceArticle(updated);
        this.likeLoading[article.id as number] = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Could not update like.');
        this.likeLoading[article.id as number] = false;
      },
    });
  }

  toggleComments(article: Article): void {
    if (!article.id) return;
    const articleId = article.id;
    this.commentsOpen[articleId] = !this.commentsOpen[articleId];
    this.comments[articleId] = this.comments[articleId] ?? [];
    if (this.commentsOpen[articleId] && this.comments[articleId].length === 0) {
      this.loadComments(articleId);
    }
  }

  loadComments(articleId: number): void {
    this.commentsLoading[articleId] = true;
    this.articleService.listComments(articleId).subscribe({
      next: (list) => {
        this.comments[articleId] = list ?? [];
        this.commentsLoading[articleId] = false;
      },
      error: () => {
        this.comments[articleId] = [];
        this.commentsLoading[articleId] = false;
      },
    });
  }

  submitComment(article: Article): void {
    if (article.id == null || this.currentUserId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/articles' } });
      return;
    }

    const articleId = article.id;
    const content = (this.commentDrafts[article.id] ?? '').trim();
    if (!content) {
      return;
    }

    this.articleService.addComment(articleId, {
      userId: this.currentUserId,
      authorName: this.currentUserLabel,
      content,
    }).subscribe({
      next: (created) => {
        const list = this.comments[articleId] ?? [];
        this.comments[articleId] = [...list, created];
        this.commentDrafts[articleId] = '';
        article.commentCount = (article.commentCount ?? 0) + 1;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Could not add comment.');
      }
    });
  }

  canDeleteComment(comment: ArticleComment): boolean {
    const userId = this.currentUserId;
    if (userId == null) return false;
    if (this.auth.isSuperAdmin()) return true;
    return comment.userId === userId;
  }

  canEditComment(comment: ArticleComment): boolean {
    const userId = this.currentUserId;
    if (userId == null) return false;
    if (this.auth.isAdmin()) return true;
    return comment.userId === userId;
  }

  startEditComment(comment: ArticleComment): void {
    if (comment.id == null || !this.canEditComment(comment)) {
      return;
    }
    this.editingCommentId = comment.id;
    this.commentEditDrafts[comment.id] = comment.content;
  }

  cancelEditComment(comment: ArticleComment): void {
    if (comment.id == null) return;
    delete this.commentEditDrafts[comment.id];
    if (this.editingCommentId === comment.id) {
      this.editingCommentId = null;
    }
  }

  saveEditedComment(article: Article, comment: ArticleComment): void {
    if (article.id == null || comment.id == null) return;
    if (!this.canEditComment(comment)) {
      this.toast.error('Only admin or comment owner can edit this comment.');
      return;
    }

    const requesterId = this.currentUserId;
    if (requesterId == null) {
      this.toast.error('You must be logged in to edit this comment.');
      return;
    }

    const nextContent = (this.commentEditDrafts[comment.id] ?? '').trim();
    if (!nextContent) {
      this.toast.error('Comment content is required.');
      return;
    }

    this.savingCommentId = comment.id;
    this.articleService.updateComment(
      article.id,
      comment.id,
      { userId: comment.userId, authorName: comment.authorName, content: nextContent },
      requesterId,
      this.auth.isAdmin(),
    ).subscribe({
      next: (updated) => {
        const articleId = article.id as number;
        const list = this.comments[articleId] ?? [];
        this.comments[articleId] = list.map((item) => (item.id === updated.id ? updated : item));
        this.savingCommentId = null;
        this.editingCommentId = null;
        delete this.commentEditDrafts[comment.id as number];
        this.toast.success('Comment updated.');
      },
      error: (err) => {
        this.savingCommentId = null;
        this.toast.error(err?.error?.message || err?.message || 'Could not update comment.');
      },
    });
  }

  deleteComment(article: Article, comment: ArticleComment): void {
    if (article.id == null || comment.id == null) return;
    if (!this.canDeleteComment(comment)) {
      this.toast.error('Only super admin or comment owner can delete this comment.');
      return;
    }

    const requesterId = this.currentUserId;
    if (requesterId == null) {
      this.toast.error('You must be logged in to delete this comment.');
      return;
    }

    if (!confirm('Delete this comment?')) {
      return;
    }

    this.deletingCommentId = comment.id;
    this.articleService.deleteComment(article.id, comment.id, requesterId, this.auth.isSuperAdmin()).subscribe({
      next: () => {
        const articleId = article.id as number;
        const list = this.comments[articleId] ?? [];
        this.comments[articleId] = list.filter((item) => item.id !== comment.id);
        article.commentCount = Math.max(0, (article.commentCount ?? 0) - 1);
        this.deletingCommentId = null;
        this.toast.success('Comment deleted.');
      },
      error: (err) => {
        this.deletingCommentId = null;
        this.toast.error(err?.error?.message || err?.message || 'Could not delete comment.');
      },
    });
  }

  categoryLabel(category: ArticleCategory): string {
    const labels: Record<ArticleCategory, string> = {
      GUIDE: 'Guide',
      ACTUALITE: 'Actualité',
      CONSEIL: 'Conseil',
    };
    return labels[category] ?? category;
  }

  trackByArticleId(_: number, article: Article): number {
    return article.id ?? 0;
  }

  articleKey(article: Article): number {
    return article.id ?? 0;
  }

  get bestLikedArticle(): Article | null {
    if (this.articles.length === 0) {
      return null;
    }

    return this.articles.reduce((best, current) =>
      this.likeValue(current) > this.likeValue(best) ? current : best
    );
  }

  get topLikeCount(): number {
    return this.likeValue(this.bestLikedArticle);
  }

  get totalLikes(): number {
    return this.articles.reduce((sum, article) => sum + this.likeValue(article), 0);
  }

  languageOptions = [
    { code: 'original' as ArticleLanguage, label: 'Original' },
    { code: 'en' as ArticleLanguage, label: 'EN' },
    { code: 'fr' as ArticleLanguage, label: 'FR' },
    { code: 'ar' as ArticleLanguage, label: 'AR' },
  ];

  getSelectedLanguage(article: Article): ArticleLanguage {
    const articleId = this.articleKey(article);
    return this.selectedLanguage[articleId] ?? 'original';
  }

  isLanguageLoading(article: Article): boolean {
    const articleId = this.articleKey(article);
    return !!this.translationLoading[articleId];
  }

  setArticleLanguage(article: Article, language: ArticleLanguage): void {
    if (!article.id) return;
    const articleId = article.id;
    this.selectedLanguage[articleId] = language;
    this.translationError[articleId] = '';

    if (language === 'original') {
      return;
    }

    const cached = this.translations[articleId]?.[language];
    if (cached) {
      return;
    }

    this.translationLoading[articleId] = true;
    this.articleService.translateArticle(articleId, language).subscribe({
      next: (translated) => {
        this.translations[articleId] = {
          ...(this.translations[articleId] ?? {}),
          [language]: translated,
        };
        this.translationLoading[articleId] = false;
      },
      error: (err) => {
        this.translationLoading[articleId] = false;
        this.translationError[articleId] = err?.error?.message || err?.message || 'Translation failed.';
        this.selectedLanguage[articleId] = 'original';
        this.toast.error('Translation unavailable right now.');
      },
    });
  }

  displayTitle(article: Article): string {
    return this.currentTranslation(article)?.titre ?? article.titre;
  }

  displaySummary(article: Article): string | null | undefined {
    return this.currentTranslation(article)?.resume ?? article.resume;
  }

  displayContent(article: Article): string {
    return this.currentTranslation(article)?.contenu ?? article.contenu;
  }

  isArabic(article: Article): boolean {
    return this.getSelectedLanguage(article) === 'ar';
  }

  canDeleteArticle(article: Article): boolean {
    const userId = this.currentUserId;
    if (userId == null) return false;
    if (this.auth.isAdmin()) return true;
    return article.ownerId === userId;
  }

  deleteArticle(article: Article): void {
    if (article.id == null) return;
    if (!this.canDeleteArticle(article)) {
      this.toast.error('Only admin or the user who posted this article can delete it.');
      return;
    }

    const requesterId = this.currentUserId;
    if (requesterId == null) {
      this.toast.error('You must be logged in to delete an article.');
      return;
    }

    if (!confirm(`Delete article "${article.titre}"?`)) {
      return;
    }

    this.deletingArticleId = article.id;
    this.articleService.deleteArticle(article.id, requesterId, this.auth.isAdmin()).subscribe({
      next: () => {
        this.articles = this.articles.filter((a) => a.id !== article.id);
        this.deletingArticleId = null;
        this.toast.success('Article deleted.');
      },
      error: (err) => {
        this.deletingArticleId = null;
        this.toast.error(err?.error?.message || err?.message || 'Could not delete this article.');
      },
    });
  }

  translationErrorMessage(article: Article): string {
    const articleId = this.articleKey(article);
    return this.translationError[articleId] ?? '';
  }

  private currentTranslation(article: Article): TranslatedArticleView | null {
    const articleId = article.id;
    if (!articleId) return null;
    const lang = this.selectedLanguage[articleId] ?? 'original';
    if (lang === 'original') return null;
    return this.translations[articleId]?.[lang] ?? null;
  }

  private replaceArticle(updated: Article): void {
    const index = this.articles.findIndex((item) => item.id === updated.id);
    if (index >= 0) {
      this.articles[index] = updated;
      this.articles = [...this.articles];
    }
  }

  private likeValue(article: Article | null | undefined): number {
    return article?.likeCount ?? 0;
  }
}
