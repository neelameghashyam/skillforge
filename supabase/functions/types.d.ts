declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };

  const serve: (handler: (req: Request) => Promise<Response> | Response) => void;
}

declare module "npm:@supabase/supabase-js@2.45.0" {
  export function createClient(...args: any[]): any;
}

declare module "npm:@supabase/supabase-js" {
  export function createClient(...args: any[]): any;
}

declare module "https://deno.land/x/smtp@0.4.0/mod.ts" {
  export function connect(...args: any[]): Promise<any>;
}
