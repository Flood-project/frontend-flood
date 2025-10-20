declare module "js-query-pagination" {
  export function createPaginate(): {
    page: (page: number) => any;
    limit: (limit: number) => any;
    search: (term: string) => any;
    equals: (key: string, value: any) => any;
    getParams: () => Record<string, any>;
  };
}
